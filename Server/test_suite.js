import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting AgriSentinel End-to-End API & RBAC Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Login as Farmer
    console.log('--- Test 1: Farmer Authentication ---');
    const farmerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'farmer@example.com', password: 'password123' })
    });
    const farmerData = await farmerLoginRes.json();
    assert(farmerLoginRes.status === 200, 'Farmer login successful');
    assert(farmerData.user.role === 'FIELD_WORKER', 'Farmer role is FIELD_WORKER');
    const farmerToken = farmerData.token;

    // 2. Login as Officer
    console.log('\n--- Test 2: Officer Authentication ---');
    const officerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer@example.com', password: 'password123' })
    });
    const officerData = await officerLoginRes.json();
    assert(officerLoginRes.status === 200, 'Officer login successful');
    assert(officerData.user.role === 'AGRICULTURAL_OFFICER', 'Officer role is AGRICULTURAL_OFFICER');
    const officerToken = officerData.token;

    // 3. Login as Admin
    console.log('\n--- Test 3: Admin Authentication ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
    });
    const adminData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin login successful');
    assert(adminData.user.role === 'ADMIN', 'Admin role is ADMIN');
    const adminToken = adminData.token;

    // 4. RBAC: Farmer attempting to access Officer GIS summary
    console.log('\n--- Test 4: Role-Based Security Restrictions ---');
    const farmerToGis = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    assert(farmerToGis.status === 403, 'Farmer is DENIED access to Officer GIS dashboard (403)');

    // 5. RBAC: Farmer attempting to access Admin stats
    const farmerToAdmin = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    assert(farmerToAdmin.status === 403, 'Farmer is DENIED access to Admin stats (403)');

    // 6. RBAC: Officer attempting to access Admin stats
    const officerToAdmin = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    assert(officerToAdmin.status === 403, 'Officer is DENIED access to Admin stats (403)');

    // 7. RBAC: Admin accessing Admin stats
    const adminToAdmin = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminStats = await adminToAdmin.json();
    assert(adminToAdmin.status === 200, 'Admin is ALLOWED access to Admin stats (200)');
    assert(adminStats.totalOfficers >= 1, `Admin sees officers count: ${adminStats.totalOfficers}`);
    assert(adminStats.totalFarmers >= 1, `Admin sees farmers count: ${adminStats.totalFarmers}`);

    // 8. Officer accessing GIS map reports
    console.log('\n--- Test 5: Officer GIS & Data Access ---');
    const officerMapRes = await fetch(`${BASE_URL}/reports/map`, {
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    const mapReports = await officerMapRes.json();
    assert(officerMapRes.status === 200, 'Officer is ALLOWED access to GIS map data');
    assert(Array.isArray(mapReports) && mapReports.length > 0, `Officer receives ${mapReports.length} reports for GIS map`);

    // 9. Farmer creating report & async ML processing
    console.log('\n--- Test 6: Farmer Report Submission & ML Pipeline ---');
    const testReportId = 'TEST_REP_' + Date.now();
    const createReportRes = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`
      },
      body: JSON.stringify({
        reportId: testReportId,
        cropType: 'Tomato',
        latitude: 11.0168,
        longitude: 76.9558,
        description: 'Leaf yellowing with dark spots observed in field A',
        severity: 'HIGH'
      })
    });
    const createdReport = await createReportRes.json();
    assert(createReportRes.status === 201, `Report created successfully with ID: ${testReportId}`);

    // 10. Check report in farmer's list
    const myReportsRes = await fetch(`${BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const myReports = await myReportsRes.json();
    assert(myReports.some(r => r.reportId === testReportId), 'Newly submitted report appears in farmer history');

    // 11. Officer adding recommendation to report
    console.log('\n--- Test 7: Officer Review & Intervention ---');
    const recommendRes = await fetch(`${BASE_URL}/reports/${testReportId}/recommend`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        officerRecommendation: 'Apply Copper Oxychloride 50 WP immediately. Check adjacent rows.',
        officerMedicine: 'Blitox-50 @ 3g/litre',
        officerNotes: 'Scheduled field inspection for next Monday'
      })
    });
    const recommendData = await recommendRes.json();
    assert(recommendRes.status === 200, 'Officer successfully saved recommendation');
    assert(recommendData.report.status === 'RESOLVED', 'Report status updated to RESOLVED');
    assert(recommendData.report.officerMedicine === 'Blitox-50 @ 3g/litre', 'Officer medicine properly saved');

    // 12. Officer creating regional alert
    console.log('\n--- Test 8: Regional Outbreak Alert System ---');
    const alertRes = await fetch(`${BASE_URL}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`
      },
      body: JSON.stringify({
        title: '⚠️ Coimbatore Region Outbreak Alert',
        message: 'High humidity detected. Late blight spread risk is extreme. Spray preventive fungicide.',
        diseaseType: 'Tomato Late Blight',
        severity: 'HIGH',
        centerLat: 11.0168,
        centerLng: 76.9558,
        radiusKm: 25
      })
    });
    const alertData = await alertRes.json();
    assert(alertRes.status === 201, 'Regional alert created and dispatched');
    assert(alertData.affectedFarmers >= 1, `Targeted ${alertData.affectedFarmers} farmers within affected radius`);

    // 13. Farmer receives their targeted alert
    const farmerAlertsRes = await fetch(`${BASE_URL}/alerts/my`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const farmerAlerts = await farmerAlertsRes.json();
    assert(farmerAlertsRes.status === 200, 'Farmer can fetch targeted regional alerts');
    assert(farmerAlerts.length > 0, `Farmer received ${farmerAlerts.length} regional alerts`);

    console.log(`\n=============================================`);
    console.log(`🏁 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`=============================================\n`);

  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runTests();
