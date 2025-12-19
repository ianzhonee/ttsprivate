import time

class PeakRPMLimiter:
    def __init__(self, max_rpm):
        self.interval = 60.0 / max_rpm
        self.last_call = 0

    def secure_call(self):
        now = time.time()
        elapsed = now - self.last_call
        if elapsed < self.interval:
            time.sleep(self.interval - elapsed)
        self.last_call = time.time()
