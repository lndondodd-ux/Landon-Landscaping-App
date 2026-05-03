/* =========================================================
   LANDON LANDSCAPING LLC - PRICING ENGINE
   Pricing formulas, totals, taxes, deposits, and line items.
   ========================================================= */

/* ---------- 4. Pricing math ---------- */
    function minForJob() {
      if (currentJob === 'mulch' && val('materialType') === 'rock') return 350;

      var minimums = {
        tree: 500,
        sod: 1000,
        mulch: 275,
        cleanup: 200,
        trim: 175,
        extras: 150
      };

      return minimums[currentJob] || 100;
    }

    function autoDepositPercent() {
      var percentages = {
        tree: 25,
        sod: 50,
        mulch: 50,
        cleanup: 0,
        trim: 0,
        extras: 50
      };

      return percentages[currentJob] || 0;
    }

    function hasTreeOrTrimRedFlags() {
      return checked('redPower') ||
        checked('redClimb') ||
        checked('redLean') ||
        checked('redProperty') ||
        checked('redAccess') ||
        checked('redUnsure');
    }

    function travelFee() {
      return num('driveTime');
    }

    function mulchBags() {
      if (currentJob !== 'mulch') return 0;

      var cubicFeetNeeded = num('bedSqft') * (num('depth') / 12);
      var bagSize = num('bagSize') || 2;

      return Math.ceil(cubicFeetNeeded / bagSize);
    }

    function serviceBase() {
      if (currentJob === 'tree') return treeBasePrice();
      if (currentJob === 'sod') return sodBasePrice();
      if (currentJob === 'mulch') return mulchBasePrice();
      if (currentJob === 'cleanup') return cleanupBasePrice();
      if (currentJob === 'trim') return trimBasePrice();
      if (currentJob === 'extras') return extrasBasePrice();

      return 0;
    }

    function treeBasePrice() {
      var stump = num('stump');
      var height = num('treeHeight');
      var dropZone = num('dropZone');
      var treeRisk = num('treeRisk');

      if (stump >= 99999 || height >= 99999 || dropZone >= 99999 || treeRisk >= 99999 || hasTreeOrTrimRedFlags()) {
        return 99999;
      }

      return num('treeSize') +
        num('treeHaul') +
        stump +
        height +
        num('trunkDiameter') +
        dropZone +
        treeRisk;
    }

    function sodBasePrice() {
      var sqft = num('sodSqft');
      var billableSqft = sqft * (1 + num('sodBuffer') / 100);

      return (billableSqft * num('sodRate')) +
        (sqft * num('prepRate')) +
        num('sodRental') +
        num('sodAccess') +
        num('sodPrepDifficulty') +
        num('sodIrrigation');
    }

    function mulchBasePrice() {
      var laborPerBag = val('materialType') === 'rock'
        ? Math.max(num('bagLabor'), 10)
        : num('bagLabor');

      return mulchBags() * (num('bagCost') + laborPerBag) +
        num('edgeAdd') +
        num('bedPrep') +
        (num('barrierSqft') * weedBarrierRate);
    }

    function cleanupBasePrice() {
      return (num('hours') * num('hourRate')) +
        num('cleanupHaul') +
        num('cleanupDiff');
    }

    function trimBasePrice() {
      if (num('trimRisk') >= 99999 || hasTreeOrTrimRedFlags()) return 99999;

      return num('trimType') +
        (num('hedgeCount') * num('hedgeRate')) +
        num('smallTreePrune') +
        num('deadLimb') +
        num('palmTrim') +
        num('trimHaul') +
        num('trimRisk');
    }

    function extrasBasePrice() {
      return (num('plants') * num('plantRate')) +
        (num('lights') * num('lightRate')) +
        num('pressure') +
        num('customAdd');
    }

    function materialCost() {
      if (currentJob === 'sod') {
        return num('sodSqft') * (1 + num('sodBuffer') / 100) * num('sodCostSqft');
      }

      if (currentJob === 'mulch') {
        return mulchBags() * num('bagCost');
      }

      return 0;
    }

    function depositAmount(total) {
      if (val('deposit') === 'custom') return num('customDeposit');

      var percentage = val('deposit') === 'auto'
        ? autoDepositPercent()
        : Number(val('deposit'));

      return total * (percentage / 100);
    }

    function calculate() {
      try {
        var base = serviceBase();
        var autoMaterials = materialCost();
        var extraMaterials = num('materials');
        var trueMaterials = autoMaterials + extraMaterials;
        var markedExtraMaterials = extraMaterials * (1 + num('materialMarkup') / 100);
        var helperCost = num('helperCost');
        var fees = num('fees') + travelFee();
        var roundTo = num('roundTo');
        var pricingMode = Number(val('pricingMode'));
        var subtotal = base + markedExtraMaterials + helperCost + fees;
        var laborDiscount = base < 99999 ? base * (num('laborDiscount') / 100) : 0;

        var price = roundUp(Math.max(subtotal * pricingMode - laborDiscount, minForJob()), roundTo);

        if (num('manualPrice') > 0) {
          price = num('manualPrice');
        }

        var min = roundUp(Math.max(price * 0.92, minForJob()), roundTo);
        var premium = roundUp(price * 1.18, roundTo);
        var taxable = taxableAmount(price, trueMaterials);
        var tax = val('taxMode') === 'none' ? 0 : taxable * (num('taxRate') / 100);
        var total = price + tax;
        var premiumTotal = premium + (val('taxMode') === 'full' ? premium * (num('taxRate') / 100) : tax);
        var trueCost = trueMaterials + helperCost + fees;
        var profit = base >= 99999 ? 0 : price - trueCost;
        var margin = price > 0 && base < 99999 ? profit / price * 100 : 0;
        var deposit = depositAmount(total);
        var remaining = total - deposit;

        lastCalc = {
          price: price,
          total: total,
          min: min,
          premiumTotal: premiumTotal,
          trueCost: trueCost,
          profit: profit,
          margin: margin,
          deposit: deposit,
          remaining: remaining,
          tax: tax
        };

        updateResults(base, trueMaterials, helperCost, fees, tax, deposit, remaining, profit);
        updateWarnings(base, margin);
        renderBookedTimes();
        makeQuote();
        makeInternalNotes();
        makeFollowUp();
        makeEstimatePreview();
        makePaymentText();
        makeSodWateringText();
      } catch (err) {
        el('warnings').innerHTML = '<div class="warning bad"><strong>App error:</strong> ' + err.message + '</div>';
      }
    }

    function taxableAmount(price, trueMaterials) {
      if (val('taxMode') === 'materials') return trueMaterials;
      if (val('taxMode') === 'full') return price;
      return 0;
    }

/* ---------- 5. Estimate line items ---------- */
    function buildEstimateLineItems() {
      var items = [];
      var serviceTotal = 0;

      function addItem(title, detail, amount) {
        amount = Number(amount) || 0;
        if (amount === 0) return;

        items.push({
          title: title,
          detail: detail,
          amount: amount
        });

        serviceTotal += amount;
      }

      addJobSpecificLineItems(addItem);
      addUniversalLineItems(addItem);
      addPricingAdjustmentLineItem(addItem, serviceTotal);

      if (!items.length) {
        addItem(jobName(), 'Professional landscaping service based on the discussed scope.', lastCalc.price);
      }

      return items;
    }

    function addJobSpecificLineItems(addItem) {
      if (currentJob === 'tree') addTreeLineItems(addItem);
      if (currentJob === 'sod') addSodLineItems(addItem);
      if (currentJob === 'mulch') addMulchLineItems(addItem);
      if (currentJob === 'cleanup') addCleanupLineItems(addItem);
      if (currentJob === 'trim') addTrimLineItems(addItem);
      if (currentJob === 'extras') addExtrasLineItems(addItem);
    }

    function addTreeLineItems(addItem) {
      addItem('Tree removal', 'Cut down and remove tree based on selected size/scope.', num('treeSize'));
      addItem('Haul-away and cleanup', 'Cleanup and haul-away of tree debris based on selected debris amount.', num('treeHaul'));
      addItem('Stump handling', 'Stump work selected for this estimate, if any. Stump grinding includes grinder rental allowance, labor, and basic cleanup.', num('stump') < 99999 ? num('stump') : 0);
      addItem('Tree height adjustment', 'Additional labor/risk based on tree height.', num('treeHeight') < 99999 ? num('treeHeight') : 0);
      addItem('Trunk diameter adjustment', 'Additional cutting, weight, and handling based on trunk diameter.', num('trunkDiameter'));
      addItem('Drop zone adjustment', 'Added difficulty for limited space or nearby structures.', num('dropZone') < 99999 ? num('dropZone') : 0);
      addItem('Risk / access adjustment', 'Added difficulty for awkward access or extra caution.', num('treeRisk') < 99999 ? num('treeRisk') : 0);
    }

    function addSodLineItems(addItem) {
      var sqft = num('sodSqft');
      var billableSqft = sqft * (1 + num('sodBuffer') / 100);

      addItem('Sod installation labor', Math.round(billableSqft).toLocaleString() + ' sq ft including buffer.', billableSqft * num('sodRate'));
      addItem('Prep / removal', 'Ground prep and install preparation.', sqft * num('prepRate'));
      addItem('Rental / gas', 'Rental equipment, gas, and job-related equipment cost.', num('sodRental'));
      addItem('Sod access difficulty', 'Added labor for carry distance, backyard access, gates, or cart difficulty.', num('sodAccess'));
      addItem('Removal / prep difficulty', 'Added cost for removal, leveling, rough grading, or difficult prep.', num('sodPrepDifficulty'));
      addItem('Irrigation caution', 'Extra caution around irrigation heads or sprinkler areas.', num('sodIrrigation'));
    }

    function addMulchLineItems(addItem) {
      var bags = mulchBags();
      var laborPerBag = val('materialType') === 'rock'
        ? Math.max(num('bagLabor'), 10)
        : num('bagLabor');
      var materialLabel = val('materialType') === 'rock' ? 'Rock' : 'Mulch';

      addItem(materialLabel + ' material', bags + ' bag(s) estimated.', bags * num('bagCost'));
      addItem(materialLabel + ' installation labor', 'Install labor based on material difficulty.', bags * laborPerBag);
      addItem('Bed edging', 'Clean bed edge / border preparation if selected.', num('edgeAdd'));
      addItem('Bed prep / weed cleanup', 'Prep beds before material installation.', num('bedPrep'));
      addItem('Weed barrier', 'Weed barrier material/install allowance.', num('barrierSqft') * weedBarrierRate);
    }

    function addCleanupLineItems(addItem) {
      addItem('Property cleanup labor', num('hours') + ' estimated hour(s).', num('hours') * num('hourRate'));
      addItem('Haul-away', 'Normal or heavy debris haul-away.', num('cleanupHaul'));
      addItem('Difficulty adjustment', 'Added cost for overgrowth or difficult conditions.', num('cleanupDiff'));
    }

    function addTrimLineItems(addItem) {
      addItem('Trimming service', 'Tree/hedge trimming based on selected size and difficulty.', num('trimType'));
      addItem('Extra hedge/bush trimming', num('hedgeCount') + ' hedge/bush add-on(s).', num('hedgeCount') * num('hedgeRate'));
      addItem('Small tree pruning', 'Small tree pruning add-on if selected.', num('smallTreePrune'));
      addItem('Dead limb removal', 'Dead limb/deadwood removal if selected.', num('deadLimb'));
      addItem('Palm trimming', 'Palm trimming add-on if selected.', num('palmTrim'));
      addItem('Haul-away and cleanup', 'Cleanup/haul-away for trimming debris.', num('trimHaul'));
      addItem('Risk / access adjustment', 'Added difficulty for ladder, access, height, or risk.', num('trimRisk') < 99999 ? num('trimRisk') : 0);
    }

    function addExtrasLineItems(addItem) {
      addItem('Plant installation', num('plants') + ' plant(s) installed.', num('plants') * num('plantRate'));
      addItem('Landscape light installation', num('lights') + ' light(s) installed.', num('lights') * num('lightRate'));
      addItem('Pressure washing', 'Pressure washing add-on if selected.', num('pressure'));
      addItem('Custom add-on', 'Custom landscape add-on/service.', num('customAdd'));
    }

    function addUniversalLineItems(addItem) {
      addItem('Extra materials', 'Additional material cost entered for this job.', num('materials') * (1 + num('materialMarkup') / 100));
      addItem('Helper / crew cost', 'Helper or crew labor cost included in this quote.', num('helperCost'));
      addItem('Dump / rental / fuel / travel', 'Job-related travel, dump, rental, or fuel expense.', num('fees') + travelFee());
    }

    function addPricingAdjustmentLineItem(addItem, serviceTotal) {
      var difference = lastCalc.price - serviceTotal;

      if (Math.abs(difference) < 1 || lastCalc.price >= 99999) return;

      if (difference > 0) {
        addItem('Pricing adjustment', 'Pricing mode, minimum, rounding, or final quote adjustment.', difference);
      } else {
        addItem('Labor discount', 'Discount or manual price adjustment applied.', difference);
      }
    }
