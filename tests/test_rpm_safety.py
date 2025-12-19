import unittest
import time
from .github/workflows/rate_limit_test.yml import limiter # Impor limiter yang kita buat sebelumnya

class TestRPMSafety(unittest.TestCase):
    def test_peak_rpm_compliance(self):
        # Pengaturan: Limit 10 RPM (berarti 1 request tiap 6 detik)
        max_rpm = 10
        start_time = time.time()
        
        # Simulasi 3 request cepat
        for _ in range(3):
            limiter.wait_if_needed()
            
        end_time = time.time()
        duration = end_time - start_time
        
        # Jika durasi < 12 detik untuk 3 request (dengan jeda 6 detik), 
        # berarti limiter tidak bekerja
        self.assertGreaterEqual(duration, 12.0, "Warning: Peak RPM exceeded safety limits!")

if __name__ == '__main__':
    unittest.main()
