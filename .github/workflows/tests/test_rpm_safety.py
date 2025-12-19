import unittest
import time
from utils.limiter import PeakRPMLimiter

class TestRPMSafety(unittest.TestCase):
    def test_interval_logic(self):
        # Simulasi limit 30 RPM (artinya harus ada jeda 2 detik tiap request)
        limit_rpm = 30
        limiter = PeakRPMLimiter(max_rpm=limit_rpm)
        
        start_time = time.time()
        
        # Simulasi 3 kali pemanggilan cepat
        for _ in range(3):
            limiter.secure_call()
            
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Jika benar, 3 request (2 jeda) harus memakan waktu minimal 4 detik
        # Kita beri toleransi sedikit (3.9 detik)
        self.assertGreaterEqual(total_duration, 3.9, 
            f"Gagal! Durasi terlalu cepat ({total_duration:.2f}s). Peak RPM bisa terlampaui!")

if __name__ == '__main__.py':
    unittest.main()
