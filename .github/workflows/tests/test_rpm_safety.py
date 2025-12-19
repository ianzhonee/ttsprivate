import unittest
import time
# Pastikan folder 'utils' memiliki file __init__.py agar bisa diimpor
from utils.limiter import PeakRPMLimiter

class TestRPMSafety(unittest.TestCase):
    def test_interval_logic(self):
        # Limit 30 RPM = 1 request setiap 2 detik
        limit_rpm = 30
        limiter = PeakRPMLimiter(max_rpm=limit_rpm)
        
        start_time = time.time()
        
        # Simulasi 3 request:
        # Request 1: Langsung (detik 0)
        # Request 2: Tunggu 2 detik
        # Request 3: Tunggu 2 detik
        # Total seharusnya >= 4 detik
        for _ in range(3):
            limiter.secure_call()
            
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Memberikan toleransi kecil untuk overhead sistem (3.9 detik)
        self.assertGreaterEqual(total_duration, 3.9, 
            f"Gagal! Durasi terlalu cepat ({total_duration:.2f}s). Peak RPM bisa terlampaui!")

if __name__ == '__main__':
    unittest.main()
