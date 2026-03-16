# Comprehensive Testing Guide - Transaction System

## 🎯 Critical Tests to Perform

### Test 1: Normal Purchase Flow ✅
**Objective:** Verify that successful purchases work correctly

**Steps:**
1. Go to Dashboard → Browse Services or Marketplace
2. Select a product under your balance amount
3. Fill out purchase form with details
4. Click "Place Order" or "Pay Now"
5. Wait for completion

**Expected Results:**
- ✅ Loading state shows "Processing Order..."
- ✅ Success message appears
- ✅ Balance decreases immediately in header
- ✅ Order appears in Orders page
- ✅ Transaction appears in Transactions page
- ✅ Console shows detailed logs:
  ```
  🛒 Starting purchase: ExpressVPN 1 Month for $12.95
  ✅ Order created: abc123
  ✅ Balance updated: 20.00 → 7.05
  ✅ Transaction recorded: -$12.95
  ✅ Purchase successful: Order abc123
  📊 Transaction Monitor: purchase of $12.95 for user xyz
  ✅ Transaction monitoring: All checks passed
  🔄 Balance synced from server: 7.05
  ```

### Test 2: Insufficient Balance ✅
**Objective:** Verify proper handling when balance is too low

**Steps:**
1. Find a product more expensive than your current balance
2. Try to purchase it

**Expected Results:**
- ❌ Error message: "Insufficient balance. Please top up your account."
- ✅ No balance change in UI
- ✅ No order created
- ✅ No transaction recorded

### Test 3: Network Failure Simulation 🧪
**Objective:** Test rollback when network fails mid-transaction

**Steps:**
1. Start a purchase
2. Quickly disconnect internet or close browser tab
3. Reconnect and check account

**Expected Results:**
- ❌ Error message about network failure
- ✅ Balance remains unchanged
- ✅ No phantom orders created
- ✅ Console shows rollback logs:
  ```
  ❌ Purchase failed: Network error
  🔄 Rolling back order: abc123
  ✅ Order rollback successful
  ```

### Test 4: Transaction Health Check 🔍
**Objective:** Verify the health monitoring system works

**Steps:**
1. Go to Dashboard
2. Scroll down to "Transaction Health Check" card
3. Click "Run Health Check"
4. If issues found, click "Auto-Fix Issues"

**Expected Results:**
- ✅ Health check completes successfully
- ✅ Shows current vs calculated balance
- ✅ Lists any discrepancies found
- ✅ Auto-fix corrects any issues
- ✅ Console shows detailed health report

### Test 5: Balance Consistency After Multiple Operations 🔄
**Objective:** Ensure balance stays consistent across operations

**Steps:**
1. Note starting balance
2. Make a purchase
3. Top up account
4. Make another purchase
5. Check Transactions page
6. Run health check

**Expected Results:**
- ✅ Balance in header matches Transactions page
- ✅ All operations recorded in transaction history
- ✅ Health check shows "Healthy" status
- ✅ Calculated balance matches profile balance

---

## 🔧 Debugging Tools

### Console Monitoring
Open browser DevTools → Console to see detailed logs:

**Purchase Logs:**
```javascript
🛒 Starting purchase: [Product] for $[Amount]
📝 Transaction Log: purchase_start
✅ Order created: [OrderID]
✅ Balance updated: [Old] → [New]
✅ Transaction recorded: -$[Amount]
📊 Transaction Monitor: purchase of $[Amount]
✅ Transaction monitoring: All checks passed
🔄 Balance synced from server: [Balance]
```

**Error Logs:**
```javascript
❌ Purchase failed: [Error Details]
🔄 Rolling back order: [OrderID]
✅ Order rollback successful
📝 Transaction Log: purchase_failed
```

### Health Check Reports
The health check provides detailed information:
- Current balance vs calculated balance
- Transaction count and history
- Last transaction date
- Specific issues found
- Auto-fix recommendations

### Manual Database Verification
1. Go to Firebase Console → Firestore Database
2. Check these collections:
   - `users/{userId}` - User profile with balance
   - `product_orders` - All orders
   - `balance_transactions` - All transactions
3. Verify data consistency

---

## 🚨 Red Flags to Watch For

### Critical Issues:
- ❌ Balance decreases but no order created
- ❌ Order created but balance not deducted
- ❌ Transaction missing from history
- ❌ Health check shows discrepancies
- ❌ Console shows rollback failures

### Warning Signs:
- ⚠️ Slow response times during purchase
- ⚠️ Multiple failed purchase attempts
- ⚠️ Balance sync warnings in console
- ⚠️ Health check finds minor discrepancies

---

## 🛠️ Maintenance Scripts

### Fix User Balances
If you find balance inconsistencies:
```bash
node scripts/fix_user_profiles.js
```

This script will:
- Check all users for balance discrepancies
- Recalculate balances from transaction history
- Automatically fix incorrect balances
- Provide detailed report of changes

### Create New Products
To add products with proper USD pricing:
```bash
node scripts/create_vpn_proxy_collection.js
```

---

## 📊 Success Metrics

### System Health Indicators:
- ✅ 100% of purchases either succeed completely or fail cleanly
- ✅ 0% phantom transactions (balance deducted without order)
- ✅ All users pass health checks
- ✅ Transaction monitoring shows no warnings
- ✅ Balance consistency across all operations

### Performance Targets:
- Purchase completion: < 3 seconds
- Health check: < 2 seconds
- Balance sync: < 1 second
- Error recovery: < 1 second

---

## 🔄 Regular Maintenance

### Daily:
- Monitor console logs for errors
- Check for failed transactions
- Verify balance consistency

### Weekly:
- Run health checks on all users
- Review transaction patterns
- Check for system anomalies

### Monthly:
- Run balance fix script
- Analyze transaction success rates
- Update monitoring thresholds

---

## 📞 Support Escalation

If issues persist after following this guide:

1. **Collect Information:**
   - User ID and email
   - Transaction timestamps
   - Console error logs
   - Health check results

2. **Immediate Actions:**
   - Run auto-fix for affected users
   - Check Firestore rules are deployed
   - Verify network connectivity

3. **Contact Details:**
   - Technical support: [Your support email]
   - Emergency escalation: [Emergency contact]

The transaction system is now bulletproof with atomic operations, automatic rollback, comprehensive monitoring, and self-healing capabilities.