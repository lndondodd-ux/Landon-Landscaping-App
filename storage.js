/* =========================================================
   LANDON LANDSCAPING LLC - STORAGE + SCHEDULING
   Saved jobs, booked times, import/export helpers.
   ========================================================= */

/* ---------- 3. Scheduling and saved jobs ---------- */
    function scheduledStartEnd() {
      var date = val('scheduleDate');
      var time = val('scheduleTime');
      var hours = num('estimatedHours');
      var bufferMinutes = num('bufferMinutes');

      if (!date || !time || !hours) return null;

      var start = new Date(date + 'T' + time);
      var end = new Date(start.getTime() + (hours * 60 + bufferMinutes) * 60 * 1000);

      return {
        start: start,
        end: end
      };
    }

    function formatTimeRange(start, end) {
      var options = {
        hour: 'numeric',
        minute: '2-digit'
      };

      return start.toLocaleTimeString([], options) + ' - ' + end.toLocaleTimeString([], options);
    }

    function savedJobs() {
      return JSON.parse(localStorage.getItem('ll_jobs') || '[]');
    }

    function scheduledConflict() {
      var currentTimeBlock = scheduledStartEnd();
      var conflicts = [];

      if (!currentTimeBlock) return conflicts;

      savedJobs().forEach(function(job) {
        if (!job.startISO || !job.endISO) return;

        var existingStart = new Date(job.startISO);
        var existingEnd = new Date(job.endISO);

        var overlaps = currentTimeBlock.start < existingEnd && currentTimeBlock.end > existingStart;

        if (overlaps) conflicts.push(job);
      });

      return conflicts;
    }

    function renderBookedTimes() {
      var selectedDate = val('scheduleDate');
      var html = '';

      savedJobs().forEach(function(job) {
        if (!job.startISO) return;
        if (selectedDate && job.startISO.indexOf(selectedDate) !== 0) return;

        var start = new Date(job.startISO);
        var end = new Date(job.endISO);

        html += '<div class="time-block">';
        html += '<strong>' + job.customer + '</strong> - ' + job.job + '<br>';
        html += start.toLocaleDateString() + ' • ' + formatTimeRange(start, end) + '<br>';
        html += '<span class="status-pill">' + job.status + '</span>';
        html += '</div>';
      });

      el('bookedTimes').innerHTML = html || '<div class="small">No saved booked times for this date yet.</div>';
    }

    function saveJob() {
      var scheduled = scheduledStartEnd();
      var conflicts = scheduledConflict();

      if (conflicts.length > 0) {
        var list = '';

        conflicts.forEach(function(job) {
          var start = new Date(job.startISO);
          var end = new Date(job.endISO);
          list += job.customer + ' - ' + job.job + ' (' + start.toLocaleDateString() + ' • ' + formatTimeRange(start, end) + ')\n';
        });

        alert('Schedule conflict. This job overlaps with:\n\n' + list + '\nPick a different start time, shorten the estimated hours, or adjust the buffer before saving.');
        return;
      }

      var jobs = savedJobs();

      jobs.unshift({
        date: new Date().toLocaleString(),
        startISO: scheduled ? scheduled.start.toISOString() : '',
        endISO: scheduled ? scheduled.end.toISOString() : '',
        customer: txt('customer') || 'Unnamed',
        info: txt('customerInfo'),
        job: jobName(),
        status: val('jobStatus'),
        leadSource: val('leadSource'),
        priority: val('jobPriority'),
        total: money(lastCalc.total),
        profit: money(lastCalc.profit),
        margin: Math.round(lastCalc.margin) + '%',
        notes: txt('notes')
      });

      localStorage.setItem('ll_jobs', JSON.stringify(jobs.slice(0, 50)));

      renderJobs();
      renderBookedTimes();
      alert('Job saved');
    }

    function renderJobs() {
      var jobs = savedJobs();

      if (!jobs.length) {
        el('savedJobs').innerHTML = '<div class="small">No saved jobs yet.</div>';
        return;
      }

      var html = '';

      jobs.forEach(function(job, index) {
        var scheduleLine = '';

        if (job.startISO) {
          var start = new Date(job.startISO);
          var end = new Date(job.endISO);
          scheduleLine = 'Scheduled: ' + start.toLocaleDateString() + ' • ' + formatTimeRange(start, end) + '<br>';
        }

        html += '<div class="job-card">';
        html += '<strong>' + job.customer + '</strong> - ' + job.job + '<br>';
        html += job.date + '<br>';
        html += 'Status: ' + job.status + '<br>';
        html += scheduleLine;
        html += 'Lead: ' + (job.leadSource || 'N/A') + ' | Priority: ' + (job.priority || 'N/A') + '<br>';
        html += 'Total: ' + job.total + ' | Profit: ' + job.profit + ' | Margin: ' + job.margin + '<br>';
        html += (job.notes || '') + '<br>';
        html += '<button class="secondary" type="button" data-delete-index="' + index + '">Delete</button>';
        html += '</div>';
      });

      el('savedJobs').innerHTML = html;
    }

    function deleteJob(index) {
      var jobs = savedJobs();
      jobs.splice(index, 1);
      localStorage.setItem('ll_jobs', JSON.stringify(jobs));
      renderJobs();
      renderBookedTimes();
      calculate();
    }
