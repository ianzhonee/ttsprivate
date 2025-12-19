import time

class PeakRPMLimiter:
    def __init__(self, max_rpm):
        # Menghitung jeda minimum antar permintaan agar tidak melebihi RPM
        self.min_interval = 60.0 / max_rpm 
        self.last_call = 0

    def secure_call(self):
        """Panggil fungsi ini setiap kali sebelum melakukan request API"""
        now = time.time()
        elapsed = now - self.last_call
        
        if elapsed < self.min_interval:
            wait_time = self.min_interval - elapsed
            time.sleep(wait_time)
        
        self.last_call = time.time()
