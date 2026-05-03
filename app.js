/* =========================================================
       LANDON LANDSCAPING LLC PRICING APP APP JAVASCRIPT
       ---------------------------------------------------------
       Sections:
       1. App state and helpers
       2. Job switching and presets
       3. Scheduling and saved jobs
       4. Pricing math
       5. Estimate line items
       6. UI rendering
       7. Text generators
       8. Payment / print / copy
       9. Defaults, reset, and event binding
       ========================================================= */


/* ---------- 1. App state and helpers ---------- */
    var currentJob = 'tree';

    var lastCalc = {
      price: 0,
      total: 0,
      min: 0,
      premiumTotal: 0,
      trueCost: 0,
      profit: 0,
      margin: 0,
      deposit: 0,
      remaining: 0,
      tax: 0
    };

    var serviceSections = [
      'treeFields',
      'sodFields',
      'mulchFields',
      'cleanupFields',
      'trimFields',
      'extrasFields'
    ];

    var jobTabs = [
      'tree',
      'sod',
      'mulch',
      'cleanup',
      'trim',
      'extras'
    ];

    var weedBarrierRate = 0.85;

    function el(id) {
      return document.getElementById(id);
    }

    function money(value) {
      return '$' + Math.round(Number(value) || 0).toLocaleString();
    }

    function num(id) {
      var element = el(id);
      return element ? Number(element.value) || 0 : 0;
    }

    function val(id) {
      var element = el(id);
      return element ? element.value : '';
    }

    function txt(id) {
      var element = el(id);
      return element ? element.value.trim() : '';
    }

    function checked(id) {
      var element = el(id);
      return element ? element.checked : false;
    }

    function setChecked(id, value) {
      var element = el(id);
      if (element) element.checked = value;
    }

    function setValue(id, value) {
      var element = el(id);
      if (element) element.value = value;
    }

    function roundUp(value, roundTo) {
      if (roundTo <= 1) return value;
      return Math.ceil(value / roundTo) * roundTo;
    }

/* ---------- 2. Job switching and presets ---------- */
    function setJob(job) {
      currentJob = job;

      serviceSections.forEach(function(sectionId) {
        el(sectionId).classList.add('hidden');
      });

      el(job + 'Fields').classList.remove('hidden');

      jobTabs.forEach(function(tabName) {
        el('tab-' + tabName).classList.remove('active');
      });

      el('tab-' + job).classList.add('active');

      applyScopeDefaults();
      calculate();
    }

    function applyScopeDefaults() {
      setChecked('scopeMaterials', currentJob === 'sod' || currentJob === 'mulch' || currentJob === 'extras');
      setChecked('scopeWarranty', currentJob === 'sod');
      setChecked('scopeEdge', currentJob === 'mulch');
      setChecked('scopeNoStump', currentJob === 'tree');
      setChecked('scopeStumpLow', false);
    }

    function applyPreset(presetName) {
      if (presetName === 'smallTree') {
        setJob('tree');
        setValue('treeSize', '450');
        setValue('treeHaul', '150');
        setValue('stump', '0');
        setValue('treeHeight', '50');
        setValue('trunkDiameter', '50');
        setValue('dropZone', '0');
        setValue('treeRisk', '0');
        setValue('fees', '50');
        setValue('helperCost', '0');
      }

      if (presetName === 'smallMulch') {
        setJob('mulch');
        setValue('bedSqft', '125');
        setValue('depth', '3');
        setValue('bagSize', '2');
        setValue('bagCost', '2');
        setValue('bagLabor', '6');
        setValue('edgeAdd', '125');
        setValue('bedPrep', '100');
      }

      if (presetName === 'sod7000') {
        setJob('sod');
        setValue('sodSqft', '7000');
        setValue('sodRate', '1.25');
        setValue('sodCostSqft', '0.40');
        setValue('sodBuffer', '5');
        setValue('prepRate', '0.25');
        setValue('sodRental', '300');
        setValue('helperCost', '1250');
      }

      if (presetName === 'cleanupHalfDay') {
        setJob('cleanup');
        setValue('hours', '4');
        setValue('hourRate', '85');
        setValue('cleanupHaul', '100');
        setValue('cleanupDiff', '100');
      }

      calculate();
    }

    function jobName() {
      var names = {
        tree: 'tree removal',
        sod: 'sod installation',
        mulch: 'mulch/rock installation',
        cleanup: 'property cleanup',
        trim: 'tree/hedge trimming',
        extras: 'landscape add-ons'
      };

      return names[currentJob] || 'landscaping service';
    }

/* ---------- 6. UI rendering ---------- */
    function updateResults(base, trueMaterials, helperCost, fees, tax, deposit, remaining, profit) {
      var profitPerHour = lastCalc.profit / Math.max(num('estimatedHours'), 1);
      var negotiationFloor = num('negotiationFloor') || Math.max(lastCalc.trueCost + 100, lastCalc.price - 75);
      var closePrice = Math.max(negotiationFloor, roundUp(lastCalc.price * 0.9, num('roundTo')));
      var meterPercent = Math.max(0, Math.min(100, Math.round(lastCalc.margin)));

      el('finalPrice').textContent = base >= 99999 ? 'REFER OUT' : money(lastCalc.total);
      el('minPrice').textContent = money(lastCalc.min);
      el('recPrice').textContent = base >= 99999 ? 'Refer' : money(lastCalc.total);
      el('premiumPrice').textContent = money(lastCalc.premiumTotal);
      el('marginTag').textContent = Math.round(lastCalc.margin) + '% margin';

      if (el('confidencePill')) el('confidencePill').textContent = base >= 99999 ? 'Refer out' : (lastCalc.margin >= 70 ? 'Strong quote' : lastCalc.margin >= 45 ? 'Healthy quote' : 'Check margin');
      if (el('decisionTitle')) el('decisionTitle').textContent = base >= 99999 ? 'I do not quote this job' : 'Quote guidance';
      if (el('decisionSubtitle')) el('decisionSubtitle').textContent = base >= 99999 ? 'This job has a safety/risk flag. I refer out or quote separately.' : 'I use this panel to decide whether to send, discount, or protect margin.';
      if (el('closePrice')) el('closePrice').textContent = base >= 99999 ? 'Refer' : money(closePrice);
      if (el('floorPrice')) el('floorPrice').textContent = base >= 99999 ? 'Refer' : money(negotiationFloor);
      if (el('premiumAsk')) el('premiumAsk').textContent = base >= 99999 ? 'Refer' : money(lastCalc.premiumTotal);
      if (el('meterLabel')) el('meterLabel').textContent = base >= 99999 ? 'Risk flag' : Math.round(lastCalc.margin) + '%';
      if (el('marginMeterFill')) el('marginMeterFill').style.width = base >= 99999 ? '100%' : meterPercent + '%';
      if (el('kpiProfit')) el('kpiProfit').textContent = base >= 99999 ? '$0' : money(profit);
      if (el('kpiCost')) el('kpiCost').textContent = money(lastCalc.trueCost);
      if (el('kpiDeposit')) el('kpiDeposit').textContent = money(deposit);
      if (el('kpiHourly')) el('kpiHourly').textContent = base >= 99999 ? '$0/hr' : money(profitPerHour) + '/hr';
      if (el('breakdownBadge')) el('breakdownBadge').textContent = currentJob.toUpperCase() + ' • live math';

      var extraJobInfo = buildExtraJobInfo();

      el('breakdown').innerHTML =
        extraJobInfo +
        'Service base: <strong>' + (base >= 99999 ? 'REFER OUT' : money(base)) + '</strong><br>' +
        'True cost: <strong>' + money(lastCalc.trueCost) + '</strong><br>' +
        'Est. material cost: <strong>' + money(trueMaterials) + '</strong><br>' +
        'Helper cost: <strong>' + money(helperCost) + '</strong><br>' +
        'Dump/rental/fuel/travel: <strong>' + money(fees) + '</strong><br>' +
        'Profit per hour: <strong>' + money(profitPerHour) + '/hr</strong><br>' +
        'Negotiation floor: <strong>' + money(negotiationFloor) + '</strong><br>' +
        'Sales tax shown: <strong>' + money(tax) + '</strong><br>' +
        'Deposit due: <strong>' + money(deposit) + '</strong><br>' +
        'Remaining balance: <strong>' + money(remaining) + '</strong><br>' +
        'Estimated profit before tax: <strong>' + money(profit) + '</strong><br><br>' +
        '<strong>Package ideas:</strong><br>' + packageOptions(lastCalc.price).replace(/\n/g, '<br>');
    }

    function buildExtraJobInfo() {
      if (currentJob === 'mulch') {
        return 'Estimated bags: <strong>' + mulchBags() + '</strong><br>';
      }

      if (currentJob === 'sod') {
        var sodSqft = num('sodSqft') * (1 + num('sodBuffer') / 100);
        return 'Sod with buffer: <strong>' + Math.round(sodSqft).toLocaleString() + ' sq ft</strong><br>' +
          'Estimated pallets: <strong>' + Math.ceil(sodSqft / 450) + '</strong><br>';
      }

      return '';
    }

    function updateWarnings(base, margin) {
      var messages = [];
      var scheduled = scheduledStartEnd();
      var conflicts = scheduledConflict();

      el('scheduleSummary').innerHTML = scheduled
        ? 'Selected time: <strong>' + scheduled.start.toLocaleDateString() + ' • ' + formatTimeRange(scheduled.start, scheduled.end) + '</strong>'
        : 'Pick a date/time to check availability.';

      if (base >= 99999) {
        messages.push('<div class="warning bad"><strong>Do not quote:</strong> Refer this out or quote separately. Do not use the displayed price.</div>');
      }

      if (conflicts.length) {
        messages.push('<div class="warning bad"><strong>Schedule conflict:</strong> This overlaps with ' + conflicts.length + ' saved booked job(s). Pick another time or adjust the estimate/buffer.</div>');
      }

      addProfitWarnings(messages, base, margin);
      addJobSpecificWarnings(messages);

      el('warnings').innerHTML = messages.join('');
    }

    function addProfitWarnings(messages, base, margin) {
      var profitPerHour = lastCalc.profit / Math.max(num('estimatedHours'), 1);
      var target = num('targetHourlyProfit') || 100;

      if (profitPerHour >= target * 1.25) {
        messages.push('<div class="warning info"><strong>High priority recommendation:</strong> This job is above your hourly profit target. Try to schedule it quickly.</div>');
      } else if (profitPerHour < target && base < 99999) {
        messages.push('<div class="warning"><strong>Pricing recommendation:</strong> Profit per hour is below your target. Raise the price, reduce helper cost, or avoid discounting.</div>');
      }

      if (margin < 40 && base < 99999) {
        messages.push('<div class="warning bad"><strong>Margin warning:</strong> This is under your 40% target. Raise price, lower helper cost, or add a difficulty/haul-away fee.</div>');
      }
    }

    function addJobSpecificWarnings(messages) {
      if (currentJob === 'tree') {
        messages.push('<div class="warning"><strong>Tree safety:</strong> Refer out power lines, serious lean, heavy limbs over property, bad access, roof/fence risk, full stump/root removal, or anything you are not comfortable doing. Stump grinding should be quoted only when access is safe and utilities/irrigation risk is clear.</div>');
      }

      if (currentJob === 'trim') {
        messages.push('<div class="warning"><strong>Trimming safety:</strong> Refer out anything near power lines, requiring climbing, or cuts you cannot control from the ground.</div>');
      }

      if (currentJob === 'sod') {
        messages.push('<div class="warning"><strong>Sod note:</strong> ' + sodWarrantyMessage() + '</div>');
      }
    }

    function sodWarrantyMessage() {
      var warranty = val('sodWarranty');

      if (warranty === 'none') {
        return 'No sod warranty is selected. Make sure the customer understands care is their responsibility.';
      }

      if (warranty === 'watering') {
        return 'Warranty is tied to the customer following watering instructions. Send the watering text after install.';
      }

      if (warranty === 'declined') {
        return 'Customer declined care/warranty plan. Note this in the quote if needed.';
      }

      return 'Send watering instructions separately. Warranty only applies if care instructions are followed.';
    }

    function packageOptions(price) {
      var roundTo = num('roundTo');
      var basic = roundUp(price * 0.92, roundTo);
      var better = roundUp(price * 1.12, roundTo);
      var best = roundUp(price * 1.3, roundTo);

      return 'Basic: current scope (' + money(basic) + ')\n' +
        'Better: upgraded scope (' + money(better) + ')\n' +
        'Best: full upgrade (' + money(best) + '+)';
    }

    function makeEstimatePreview() {
      var customer = txt('customer') || 'Customer';
      var info = txt('customerInfo') || '';
      var estimateDate = new Date().toLocaleDateString();
      var estimateNumber = 'EST-' + new Date().getFullYear() + '-' + String(savedJobs().length + 1).padStart(3, '0');
      var notes = txt('notes') || 'Professional landscaping service based on the discussed scope.';
      var taxPercent = val('taxMode') === 'none' ? '0.0%' : num('taxRate').toFixed(1) + '%';
      var rows = buildEstimateRows(taxPercent);

      var html = '';
      html += '<div class="estimate-header">';
      html += '<div class="estimate-logo">🌿 Landon<br><span style="font-size:12px;letter-spacing:1px;">LANDSCAPING LLC.</span></div>';
      html += '<div class="estimate-business">LANDON LANDSCAPING LLC<br>657-417-7599<br>Green Cove Springs, Florida</div>';
      html += '</div>';
      html += '<div class="estimate-title">ESTIMATE</div>';
      html += '<div class="estimate-date">' + estimateDate + '</div>';
      html += '<div class="estimate-info">';
      html += '<div><strong>BILL TO:</strong><br>' + customer + '<br>' + info + '</div>';
      html += '<div style="text-align:right;"><strong>NUMBER:</strong> ' + estimateNumber + '<br><strong>DATE:</strong> ' + estimateDate + '<br><strong>DUE:</strong> Upon acceptance</div>';
      html += '</div>';
      html += '<table class="estimate-table">';
      html += '<thead><tr><th>Description</th><th>Quantity</th><th>Tax</th><th>Amount</th></tr></thead>';
      html += '<tbody>' + rows + '</tbody>';
      html += '</table>';
      html += '<div class="estimate-bottom">';
      html += '<div class="estimate-payment"><strong>Payment instructions</strong><br>Use the secure payment buttons below the estimate. Deposit may be required before scheduling or ordering materials.<br><br><strong>Project notes</strong><br>' + notes + '<br><br><strong>Terms</strong><br>Quote is based on the discussed scope. Additional work may change the total.</div>';
      html += '<div class="estimate-totals">';
      html += '<div class="estimate-total-row"><span>SUBTOTAL:</span><span>' + money(lastCalc.price) + '</span></div>';
      html += '<div class="estimate-total-row"><span>TAX:</span><span>' + money(lastCalc.tax) + '</span></div>';
      html += '<div class="estimate-total-row"><span>TOTAL:</span><span>' + money(lastCalc.total) + '</span></div>';
      html += '<div class="estimate-total-row"><span>DEPOSIT:</span><span>' + money(lastCalc.deposit) + '</span></div>';
      html += '<div class="balance-due"><span>BALANCE DUE</span><span>' + money(lastCalc.remaining) + '</span></div>';
      html += '</div>';
      html += '</div>';

      el('estimatePreview').innerHTML = html;
    }

    function buildEstimateRows(taxPercent) {
      var rows = '';

      buildEstimateLineItems().forEach(function(item) {
        rows += '<tr>';
        rows += '<td><div class="estimate-desc-title">' + item.title + '</div><div class="estimate-desc-sub">' + item.detail + '</div></td>';
        rows += '<td class="qty-cell">1</td>';
        rows += '<td class="tax-cell">' + taxPercent + '</td>';
        rows += '<td class="amount-cell">' + money(item.amount) + '</td>';
        rows += '</tr>';
      });

      return rows;
    }

/* ---------- 8. Payment / print / copy ---------- */
    function openPaymentLink(type) {
      var link = type === 'stripe' ? txt('stripeLink') : txt('paypalLink');
      var label = type === 'stripe' ? 'Stripe' : 'PayPal';

      if (!link) {
        alert('Add your ' + label + ' link first.');
        return;
      }

      if (type === 'stripe') {
        if (link.indexOf('http://') !== 0 && link.indexOf('https://') !== 0) {
          alert('Stripe needs a full payment link that starts with https://');
          return;
        }

        window.open(link, '_blank');
        return;
      }

      if (link.indexOf('@') > -1 && link.indexOf('http') !== 0) {
        window.open('https://www.paypal.com/myaccount/transfer/send?recipient=' + encodeURIComponent(link), '_blank');
        return;
      }

      if (link.indexOf('http://') !== 0 && link.indexOf('https://') !== 0) {
        link = 'https://' + link;
      }

      window.open(link, '_blank');
    }

    function printEstimate() {
      window.print();
    }

    function copyBox(id) {
      var box = el(id);
      if (!box) return;

      box.select();
      box.setSelectionRange(0, 99999);

      navigator.clipboard.writeText(box.value)
        .then(function() {
          alert('Copied');
        })
        .catch(function() {
          document.execCommand('copy');
          alert('Copied');
        });
    }

/* ---------- 9. Defaults, reset, and event binding ---------- */
    function saveDefaults() {
      var ids = [
        'sodRate',
        'sodCostSqft',
        'sodBuffer',
        'prepRate',
        'sodAccess',
        'sodPrepDifficulty',
        'sodIrrigation',
        'sodWarranty',
        'bagCost',
        'bagLabor',
        'edgeAdd',
        'bedPrep',
        'hourRate',
        'materialMarkup',
        'taxRate',
        'taxMode',
        'deposit',
        'roundTo',
        'scheduleLine',
        'pricingMode',
        'quoteStyle',
        'targetHourlyProfit',
        'depositDue',
        'stripeLink',
        'paypalLink',
        'venmoName',
        'appleCashInfo'
      ];

      var defaults = {};

      ids.forEach(function(id) {
        defaults[id] = val(id);
      });

      localStorage.setItem('ll_defaults', JSON.stringify(defaults));
      alert('Defaults saved on this device');
    }

    function loadDefaults() {
      try {
        var defaults = JSON.parse(localStorage.getItem('ll_defaults') || '{}');

        Object.keys(defaults).forEach(function(id) {
          if (el(id) && defaults[id] !== '') {
            el(id).value = defaults[id];
          }
        });
      } catch (e) {}

      if (el('venmoName') && !el('venmoName').value) el('venmoName').value = 'landonlandscaping';
      if (el('appleCashInfo') && !el('appleCashInfo').value) el('appleCashInfo').value = '657-417-7599';
      if (el('paypalLink') && !el('paypalLink').value) el('paypalLink').value = 'aimeedodd08@gmail.com';
    }

    function resetForm() {
      var fieldsToClear = [
        'customer',
        'customerInfo',
        'notes',
        'scheduleDate',
        'scheduleTime',
        'materials',
        'helperCost',
        'fees',
        'sodSqft',
        'sodRental',
        'bedSqft',
        'barrierSqft',
        'hours',
        'plants',
        'lights',
        'customAdd',
        'customDeposit',
        'hedgeCount',
        'manualPrice',
        'laborDiscount',
        'negotiationFloor'
      ];

      fieldsToClear.forEach(function(id) {
        setValue(id, '');
      });

      [
        'redPower',
        'redClimb',
        'redLean',
        'redProperty',
        'redAccess',
        'redUnsure'
      ].forEach(function(id) {
        setChecked(id, false);
      });

      calculate();
    }

    function exportJobs() {
      var jobs = savedJobs();

      if (!jobs.length) {
        alert('No saved jobs to export yet.');
        return;
      }

      var backup = JSON.stringify(jobs, null, 2);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(backup)
          .then(function() {
            alert('Backup copied. Save it somewhere safe.');
          })
          .catch(function() {
            window.prompt('Copy this backup text:', backup);
          });
      } else {
        window.prompt('Copy this backup text:', backup);
      }
    }

    function importJobs() {
      var text = txt('importJobsText');

      if (!text) {
        alert('Paste your backup text first.');
        return;
      }

      try {
        var imported = JSON.parse(text);

        if (!Array.isArray(imported)) {
          alert('That backup does not look right.');
          return;
        }

        if (!confirm('Import ' + imported.length + ' saved job(s)? This will replace saved jobs on this device.')) {
          return;
        }

        localStorage.setItem('ll_jobs', JSON.stringify(imported));
        setValue('importJobsText', '');
        renderJobs();
        renderBookedTimes();
        calculate();
        alert('Saved jobs imported.');
      } catch (error) {
        alert('Import failed. Make sure you pasted the full backup text exactly.');
      }
    }

    function clearJobs() {
      if (!confirm('Clear all saved jobs?')) return;

      localStorage.removeItem('ll_jobs');
      renderJobs();
      renderBookedTimes();
      calculate();
    }

    function bind(id, eventName, handler) {
      var element = el(id);
      if (element) {
        element.addEventListener(eventName, handler);
      }
    }

    function attachEvents() {
      jobTabs.forEach(function(job) {
        bind('tab-' + job, 'click', function() {
          setJob(job);
        });
      });

      bind('preset-tree', 'click', function() { applyPreset('smallTree'); });
      bind('preset-mulch', 'click', function() { applyPreset('smallMulch'); });
      bind('preset-sod', 'click', function() { applyPreset('sod7000'); });
      bind('preset-cleanup', 'click', function() { applyPreset('cleanupHalfDay'); });

      bind('copyQuoteBtn', 'click', function() { copyBox('quoteText'); });
      bind('copyInternalBtn', 'click', function() { copyBox('internalText'); });
      bind('copyFollowBtn', 'click', function() { copyBox('followText'); });
      bind('copyPaymentBtn', 'click', function() { copyBox('paymentText'); });
      bind('copySodWateringBtn', 'click', function() { copyBox('sodWateringText'); });

      bind('openStripeBtn', 'click', function() { openPaymentLink('stripe'); });
      bind('openPaypalBtn', 'click', function() { openPaymentLink('paypal'); });
      bind('estimateStripeBtn', 'click', function() { openPaymentLink('stripe'); });
      bind('estimatePaypalBtn', 'click', function() { openPaymentLink('paypal'); });
      bind('printEstimateBtn', 'click', printEstimate);

      bind('saveJobBtn', 'click', saveJob);
      bind('saveDefaultsBtn', 'click', saveDefaults);
      bind('resetBtn', 'click', resetForm);
      bind('exportJobsBtn', 'click', exportJobs);
      bind('importJobsBtn', 'click', importJobs);
      bind('clearJobsBtn', 'click', clearJobs);

      if (el('savedJobs')) {
        el('savedJobs').addEventListener('click', function(event) {
          if (event.target && event.target.hasAttribute('data-delete-index')) {
            deleteJob(Number(event.target.getAttribute('data-delete-index')));
          }
        });
      }

      document.querySelectorAll('input, select, textarea').forEach(function(input) {
        input.addEventListener('input', calculate);
        input.addEventListener('change', calculate);
      });
    }

    window.addEventListener('DOMContentLoaded', function() {
      attachEvents();
      loadDefaults();
      setJob('tree');
      renderJobs();
      renderBookedTimes();
      calculate();
    });
