/* =========================================================
   LANDON LANDSCAPING LLC - TEXT TEMPLATES
   Customer quote, internal notes, follow-ups, payment text.
   ========================================================= */

/* ---------- 7. Text generators ---------- */
    function scopeLines() {
      var lines = [];

      if (checked('scopeMaterials')) lines.push('Materials included');
      if (checked('scopeHaul')) lines.push('Haul-away included');
      if (checked('scopeCleanup')) lines.push('Cleanup included');
      if (checked('scopeEdge')) lines.push('Bed edging included');
      if (checked('scopeStumpLow')) lines.push('Stump cut low');
      if (checked('scopeNoStump')) lines.push('Stump grinding excluded unless listed separately');
      if (checked('scopeNoIrrigation')) lines.push('Irrigation repairs excluded');
      if (checked('scopeWarranty')) lines.push('30-day limited workmanship warranty included');

      return lines;
    }

    function makeQuote() {
      var customer = txt('customer');
      var greeting = customer ? 'Hi ' + customer + ',' : 'Hi,';
      var notes = txt('notes') ? '\n\nScope: ' + txt('notes') + '.' : '';
      var taxLabel = val('taxMode') === 'materials' ? 'sales tax on materials' : 'sales tax';
      var taxLine = val('taxMode') === 'none'
        ? '\nTotal: ' + money(lastCalc.total)
        : '\nTotal: ' + money(lastCalc.total) + ' including ' + money(lastCalc.tax) + ' ' + taxLabel;
      var depositLine = lastCalc.deposit > 0
        ? '\n\nDeposit due ' + val('depositDue').toLowerCase() + ': ' + money(lastCalc.deposit) + '\nRemaining balance due upon completion: ' + money(lastCalc.remaining)
        : '';
      var schedule = val('scheduleLine') === 'yes'
        ? '\n\nIf you’d like to move forward, I can get you on the schedule.'
        : '';
      var scope = scopeLines().length
        ? '\n\nIncludes/notes:\n- ' + scopeLines().join('\n- ')
        : '';
      var safety = currentJob === 'tree'
        ? '\n\nTree removal includes cutting down the tree, cleanup, and haul-away of tree debris when haul-away is selected. Stump grinding or full stump/root removal is not included unless listed separately. This price is based on the tree being safe to remove with the discussed scope. If anything unsafe is found in person, I’ll let you know before moving forward.'
        : '';

      if (lastCalc.price >= 99999) {
        el('quoteText').value = greeting + '\n\nAfter looking over the details, this is something I would recommend referring out or quoting separately due to the risk/scope. I don’t want to take on work unless I know it can be done safely and correctly.\n\nThank you,\nLandon Landscaping LLC\n657-417-7599';
        return;
      }

      if (val('quoteStyle') === 'short') {
        el('quoteText').value = greeting + '\n\nFor the ' + jobName() + ', my price would be ' + money(lastCalc.price) + '.' + taxLine + depositLine + '\n\nThank you,\nLandon Landscaping LLC\n657-417-7599';
        return;
      }

      if (val('quoteStyle') === 'friendly') {
        el('quoteText').value = greeting + '\n\nI got everything looked over. For the ' + jobName() + ', I’d be at ' + money(lastCalc.price) + '.' + taxLine + notes + scope + depositLine + schedule + '\n\nThank you,\nLandon Landscaping LLC\n657-417-7599';
        return;
      }

      el('quoteText').value = greeting + '\n\nFor the ' + jobName() + ', my price would be ' + money(lastCalc.price) + '.' + taxLine + notes + scope + depositLine + safety + schedule + '\n\nThank you,\nLandon Landscaping LLC\n657-417-7599';
    }

    function makeInternalNotes() {
      var scheduled = scheduledStartEnd();
      var out = [];

      out.push('INTERNAL NOTES - ' + jobName().toUpperCase());
      out.push('Customer: ' + (txt('customer') || 'N/A'));
      out.push('Info: ' + (txt('customerInfo') || 'N/A'));
      out.push('Status: ' + val('jobStatus'));
      out.push('Lead source: ' + val('leadSource') + ' | Priority: ' + val('jobPriority'));
      out.push('Travel fee: ' + money(travelFee()));
      out.push(scheduled ? 'Scheduled: ' + scheduled.start.toLocaleDateString() + ' • ' + formatTimeRange(scheduled.start, scheduled.end) : 'Scheduled: not set');
      out.push('Notes: ' + (txt('notes') || 'N/A'));
      out.push('Minimum / Recommended / Premium: ' + money(lastCalc.min) + ' / ' + money(lastCalc.total) + ' / ' + money(lastCalc.premiumTotal));
      out.push('True cost: ' + money(lastCalc.trueCost) + ' | Profit: ' + money(lastCalc.profit) + ' | Margin: ' + Math.round(lastCalc.margin) + '%');
      out.push('Profit per hour: ' + money(lastCalc.profit / Math.max(num('estimatedHours'), 1)) + '/hr | Target: ' + money(num('targetHourlyProfit') || 100) + '/hr');
      out.push('Negotiation floor: ' + money(num('negotiationFloor') || Math.max(lastCalc.trueCost + 100, lastCalc.price - 75)));
      out.push('Deposit: ' + money(lastCalc.deposit) + ' | Remaining: ' + money(lastCalc.remaining));

      addJobSpecificInternalNotes(out);

      out.push('Upsell ideas: ' + upsellIdeas().join(', '));
      out.push('Packages:\n' + packageOptions(lastCalc.price));

      el('internalText').value = out.join('\n');
    }

    function addJobSpecificInternalNotes(out) {
      if (currentJob === 'sod') {
        var sqft = num('sodSqft') * (1 + num('sodBuffer') / 100);
        out.push('Shopping list: ' + Math.ceil(sqft / 450) + ' pallets St. Augustine sod (' + Math.round(sqft) + ' sq ft with buffer)');
      }

      if (currentJob === 'mulch') {
        var laborPerBag = val('materialType') === 'rock' ? Math.max(num('bagLabor'), 10) : num('bagLabor');
        out.push('Shopping list: ' + mulchBags() + ' bags of ' + val('materialType') + ' at ' + num('depth') + ' inch depth. Labor per bag used: ' + laborPerBag);
      }

      if (currentJob === 'tree') {
        out.push('Equipment: chainsaw, sharp chain, rope, wedges, rake/tarp, PPE, truck/trailer, dump plan');
      }

      if (currentJob === 'trim') {
        out.push('Equipment: hedge trimmer, loppers, hand pruners, pole saw if needed, rake/tarp, blower, gloves, eye/hearing protection');
      }
    }

    function upsellIdeas() {
      var ideas = {
        tree: ['fresh mulch ring', 'new plant/tree install', 'stump grinding if safe', 'bed cleanup'],
        sod: ['perfect bed edges', 'mulch or rock refresh', 'plant package', 'landscape lighting', 'maintenance plan'],
        mulch: ['weed barrier', 'bed expansion', 'plants', 'landscape lighting', 'fresh edging'],
        cleanup: ['mulch refresh', 'hedge trimming', 'haul-away upgrade', 'pressure washing'],
        trim: ['haul-away upgrade', 'mulch refresh', 'tree ring cleanup', 'palm trimming', 'bed edging'],
        extras: ['plants', 'landscape lighting', 'mulch/rock', 'pressure washing']
      };

      return ideas[currentJob] || [];
    }

    function makeFollowUp() {
      var customer = txt('customer') || 'there';
      var job = jobName();
      var type = val('followType');
      var scheduled = scheduledStartEnd();
      var msg = '';

      if (type === 'follow') {
        msg = 'Hi ' + customer + '! Just following up on the ' + job + ' quote I sent over. Let me know if you have any questions or if you’d like me to get you on the schedule.';
      }

      if (type === 'confirm') {
        msg = 'Hi ' + customer + '! Just confirming we’re scheduled' + (scheduled ? ' for ' + scheduled.start.toLocaleDateString() + ' at ' + scheduled.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '') + ' for the ' + job + '. I’ll let you know when I’m on the way. Thank you!';
      }

      if (type === 'daybefore') {
        msg = 'Hi ' + customer + '! Just a reminder that I’m scheduled to come by tomorrow for the ' + job + '. Let me know if anything changes. Thank you!';
      }

      if (type === 'thanks') {
        msg = 'Hi ' + customer + '! The job is all finished. Thank you again for choosing Landon Landscaping LLC. If you need anything else, just let me know.';
      }

      if (type === 'review') {
        msg = 'Hi ' + customer + '! Thank you again for choosing Landon Landscaping LLC. If you’re happy with the work, I’d really appreciate a quick review or recommendation in the neighborhood group.';
      }

      if (type === 'photo') {
        msg = 'Hi ' + customer + '! Would you be okay with me using before/after photos of the project for my business page? I wouldn’t include any personal information.';
      }

      if (type === 'payment') {
        msg = 'Hi ' + customer + '! Just sending a payment reminder for the ' + job + '. Total: ' + money(lastCalc.total) + '. Deposit: ' + money(lastCalc.deposit) + '. Remaining balance: ' + money(lastCalc.remaining) + '. Thank you!';
      }

      el('followText').value = msg;
    }

    function makeSodWateringText() {
      if (!el('sodWateringText')) return;

      var text = '';
      text += 'Sod Watering Instructions\n\n';
      text += 'For the first 2 weeks, keep the new sod consistently moist. Water 2-3 times per day depending on heat, sun, and rainfall. The goal is to keep the sod and soil underneath damp, not flooded.\n\n';
      text += 'Weeks 3-4: begin watering deeper but less often, usually once per day or every other day depending on weather.\n\n';
      text += 'Do not mow until the sod has rooted and cannot be easily lifted. When mowing, keep St. Augustine around 3.5-4 inches tall and avoid scalping.\n\n';
      text += 'Avoid heavy foot traffic, pets, and parked equipment on the sod while it establishes. Customer watering and care are required for successful establishment.\n\n';
      text += 'Landon Landscaping LLC';

      el('sodWateringText').value = text;
    }

    function makePaymentText() {
      var customer = txt('customer') || 'there';
      var lines = [];

      lines.push('Hi ' + customer + '! Here is the payment information for the ' + jobName() + '.');
      lines.push('');
      lines.push('Total: ' + money(lastCalc.total));

      if (lastCalc.deposit > 0) {
        lines.push('Deposit due: ' + money(lastCalc.deposit));
        lines.push('Remaining balance due upon completion: ' + money(lastCalc.remaining));
      }

      if (txt('stripeLink')) lines.push('Stripe payment link: ' + txt('stripeLink'));
      if (txt('paypalLink')) lines.push('PayPal: ' + txt('paypalLink'));
      if (txt('venmoName')) lines.push('Venmo: ' + txt('venmoName'));
      if (txt('appleCashInfo')) lines.push('Apple Cash: ' + txt('appleCashInfo'));

      lines.push('');
      lines.push('Thank you!');
      lines.push('Landon Landscaping LLC');

      el('paymentText').value = lines.join('\n');
    }
