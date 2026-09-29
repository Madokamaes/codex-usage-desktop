use std::{sync::Mutex, time::{Duration, Instant, SystemTime}};

// Hold the lock through the query: queued callers reuse the completed result,
// including errors, instead of each launching their own fallback process.
pub struct QueryCache<T> {
    entry: Mutex<Option<(Option<SystemTime>, Instant, Result<T, String>)>>,
}
impl<T: Clone> QueryCache<T> {
    pub const fn new() -> Self { Self { entry: Mutex::new(None) } }
    pub fn run(&self, account_stamp: Option<SystemTime>, success_ttl: Duration,
        failure_ttl: Duration, query: impl FnOnce() -> Result<T, String>) -> Result<T, String> {
        let mut entry = self.entry.lock().map_err(|_| "Usage query lock poisoned".to_string())?;
        if let Some((stamp, completed, result)) = entry.as_ref() {
            let ttl = if result.is_ok() { success_ttl } else { failure_ttl };
            if *stamp == account_stamp && completed.elapsed() < ttl { return result.clone(); }
        }
        let result = query();
        *entry = Some((account_stamp, Instant::now(), result.clone()));
        result
    }
    pub fn clear(&self) {
        if let Ok(mut entry) = self.entry.lock() { *entry = None; }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Barrier, atomic::{AtomicUsize, Ordering}};
    #[test]
    fn concurrent_failures_only_run_one_query() {
        let cache = Arc::new(QueryCache::<usize>::new());
        let calls = Arc::new(AtomicUsize::new(0));
        let barrier = Arc::new(Barrier::new(32));
        let jobs: Vec<_> = (0..32).map(|_| {
            let (cache, calls, barrier) = (cache.clone(), calls.clone(), barrier.clone());
            std::thread::spawn(move || {
                barrier.wait();
                cache.run(None, Duration::from_secs(15), Duration::from_secs(60), || {
                    calls.fetch_add(1, Ordering::SeqCst);
                    Err("network and CLI failed".into())
                })
            })
        }).collect();
        for job in jobs { assert!(job.join().unwrap().is_err()); }
        assert_eq!(calls.load(Ordering::SeqCst), 1);
    }
    #[test]
    fn success_is_shared_and_expiration_and_account_change_refresh() {
        let cache = QueryCache::new();
        let ttl = Duration::from_secs(60);
        assert_eq!(cache.run(None, ttl, ttl, || Ok(1)), Ok(1));
        assert_eq!(cache.run(None, ttl, ttl, || panic!("duplicate query")), Ok(1));
        assert_eq!(cache.run(None, Duration::ZERO, ttl, || Ok(2)), Ok(2));
        assert_eq!(cache.run(Some(SystemTime::now()), ttl, ttl, || Ok(3)), Ok(3));
        cache.clear();
        assert_eq!(cache.run(None, ttl, ttl, || Ok(4)), Ok(4));
    }
}
