import time

class PeakRPMLimiter:
    def __init__(self, max_rpm):
        """
        max_rpm: Jumlah maksimal request yang diperbolehkan dalam 60 detik.
        """
        # Kita hanya butuh satu variabel untuk menyimpan jeda antar request
        self.interval = 60.0 / max_rpm
        self.last_call = 0

    def secure_call(self):
        """Panggil fungsi ini setiap kali sebelum melakukan request API"""
        now = time.time()
        elapsed = now - self.last_call
        
        # Jika waktu yang berlalu lebih kecil dari interval yang diizinkan
        if elapsed < self.interval:
            wait_time = self.interval - elapsed
            time.sleep(wait_time)
        
        # Update last_call SETELAH sleep selesai agar akurat
        self.last_call = time.time()
