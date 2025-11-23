# Quick Testing Checklist

## Web App Testing

### Performance
- [ ] Page loads in < 3 seconds
- [ ] Map renders in < 2 seconds
- [ ] 100 markers render smoothly
- [ ] API calls complete in < 500ms
- [ ] WebSocket connects in < 1s

### Functionality
- [ ] All animals display correctly
- [ ] Corridors render as polygons
- [ ] Risk zones visible
- [ ] Alerts show on map
- [ ] Real-time updates work
- [ ] Filters function correctly
- [ ] Search works
- [ ] Stats update correctly

### Browser Compatibility
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## Mobile App Testing

### Performance
- [ ] App launches in < 3s
- [ ] Map loads in < 2s
- [ ] Offline mode works
- [ ] GPS tracking accurate
- [ ] Battery usage acceptable

### Offline Functionality
- [ ] GPS tracking works offline
- [ ] Alerts save offline
- [ ] Map tiles load from cache
- [ ] Data syncs when online
- [ ] No data loss

### Device Testing
- [ ] iPhone (iOS 13+)
- [ ] Android (8.0+)
- [ ] Different screen sizes
- [ ] Portrait & Landscape

---

## Critical Paths

### Web App
1. Login → View Map → See Animals → Create Alert
2. View Dashboard → Check Stats → Navigate to Map
3. Filter Animals → Select Animal → View Details

### Mobile App
1. Login → Start GPS → Create Alert Offline → Sync
2. Download Map Tiles → Go Offline → Use Map
3. Track Location → Save Offline → Auto-Sync

---

## Quick Smoke Tests

### Web (5 minutes)
1. Open app → Check map loads
2. Verify animals visible
3. Test one filter
4. Check WebSocket connection

### Mobile (5 minutes)
1. Launch app → Check map
2. Toggle offline mode
3. Create test alert
4. Verify sync works

