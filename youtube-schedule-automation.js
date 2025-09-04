(() => {
    // -----------------------------------------------------------------
    // CONFIG
    // -----------------------------------------------------------------
    const MODE = 'publish_drafts'; // 'publish_drafts' / 'sort_playlist'
    const DEBUG_MODE = true;
    const MADE_FOR_KIDS = false;

    const VISIBILITY = 'Public';   // 'Private' | 'Unlisted' | 'Public'
    const DATE_OFFSET = 0;         // 0 = today, 1 = tomorrow, etc.
    const START_TIME = "08:00";    // HH:MM (24h)
    const GAP_MINUTES = 15;        // gap between videos in minutes
    const COUNT = 5;              // number of videos to schedule

    // Minimum future buffer so YT won't roll date forward
    const MIN_LEAD_MINUTES = 5;    // make sure the first time is at least now+5min
    // -----------------------------------------------------------------

    const TIMEOUT_STEP_MS = 20;
    const DEFAULT_ELEMENT_TIMEOUT_MS = 10000;
    const VISIBILITY_PUBLISH_ORDER = { 'Private': 0, 'Unlisted': 1, 'Public': 2 };

    function debugLog(...args) { if (DEBUG_MODE) console.debug(...args); }
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function waitForElement(selector, baseEl, timeoutMs = DEFAULT_ELEMENT_TIMEOUT_MS) {
        if (!baseEl) baseEl = document;
        let timeout = timeoutMs;
        while (timeout > 0) {
            if (baseEl === null) throw new Error('Base element is null');
            let element = baseEl.querySelector(selector);
            if (element !== null) return element;
            await sleep(TIMEOUT_STEP_MS);
            timeout -= TIMEOUT_STEP_MS;
        }
        throw new Error(`Could not find ${selector} inside`, baseEl);
    }

    function click(element) {
        const event = document.createEvent('MouseEvents');
        event.initMouseEvent('mousedown', true, false, window);
        element.dispatchEvent(event);
        element.click();
        debugLog(element, 'clicked');
    }

    function pressEnter(el) {
        const evtOptions = { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 };
        ['keydown', 'keypress', 'keyup'].forEach(type => el.dispatchEvent(new KeyboardEvent(type, evtOptions)));
    }

    function parseHHMM(str) {
        const [h, m] = str.split(':').map(Number);
        return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
    }

    function startOfDayLike(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    }

    function endOfDayLike(d) {
        const x = new Date(d);
        x.setHours(23, 59, 0, 0);
        return x;
    }

    // Build base scheduled datetime from knobs
    function buildBaseDate(offsetDays, startHHMM) {
        const now = new Date();
        const base = new Date(now);
        base.setDate(base.getDate() + offsetDays);
        const { h, m } = parseHHMM(startHHMM);
        base.setHours(h, m, 0, 0);
        return base;
    }

    // Ensure a datetime is at least now+lead, while trying to keep the same calendar day
    function ensureFuture(target, leadMinutes) {
        const nowPlusLead = new Date(Date.now() + leadMinutes * 60000);

        if (target.getTime() >= nowPlusLead.getTime()) return target; // already fine

        // Try to keep same day by pushing within today (or the target's day)
        const sameDayEnd = endOfDayLike(target);
        if (nowPlusLead.getTime() <= sameDayEnd.getTime()) {
            // keep same day, bump time up
            const fixed = new Date(target);
            fixed.setHours(nowPlusLead.getHours(), nowPlusLead.getMinutes(), 0, 0);
            debugLog(`⏩ Bumped time within same day to keep DATE_OFFSET: ${fixed}`);
            return fixed;
        }

        // Can't keep same day; must roll to next day
        const next = new Date(target);
        next.setDate(next.getDate() + 1);
        next.setHours(nowPlusLead.getHours(), nowPlusLead.getMinutes(), 0, 0);
        debugLog(`↪️ Rolled to next day to stay in the future: ${next}`);
        return next;
    }

    // -----------------------------------------------------------------
    // SCHEDULE CLASS
    // -----------------------------------------------------------------
    class Schedule {
        constructor(raw) { this.raw = raw; }

        async expandScheduleSection() {
            const expandBtn = await waitForElement('#second-container-expand-button', this.raw);
            click(expandBtn); await sleep(500);
        }

        async saveSchedule() {
            const saveBtn = await waitForElement('#done-button', this.raw);
            click(saveBtn); await sleep(500);
        }

        async setDate(targetDate) {
            const dateTrigger = await waitForElement('#datepicker-trigger', this.raw);
            click(dateTrigger);
            await sleep(500);

            // Find the floating calendar popup input dynamically
            let dateInput = null;
            for (let i = 0; i < 10; i++) {
                dateInput = document.querySelector('tp-yt-iron-input input[autofocus]');
                if (dateInput) break;
                await sleep(200);
            }

            if (!dateInput) {
                console.warn('⚠️ Date input not found in popup');
                return;
            }

            const day = targetDate.getDate();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[targetDate.getMonth()];
            const year = targetDate.getFullYear();
            const formattedDate = `${day} ${month} ${year}`;

            // Clear + set value
            dateInput.focus();
            dateInput.select();
            dateInput.value = '';
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));

            dateInput.value = formattedDate;
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));

            // Close the calendar
            pressEnter(dateInput);
            dateInput.blur();

            debugLog(`📅 Date set to ${formattedDate}`);
            await sleep(300);
        }





        async setTime(targetDate) {
            const timeTrigger = await waitForElement('#time-of-day-container', this.raw);
            click(timeTrigger); await sleep(300);

            let timeInput = this.raw.querySelector('tp-yt-paper-input input');
            if (!timeInput) { console.error('❌ Time input not found'); return; }

            const hh = String(targetDate.getHours()).padStart(2, '0');
            const mm = String(targetDate.getMinutes()).padStart(2, '0');
            const formattedTime = `${hh}:${mm}`;

            timeInput.focus();
            timeInput.select();
            timeInput.value = '';
            timeInput.dispatchEvent(new Event('input', { bubbles: true }));

            timeInput.value = formattedTime;
            timeInput.dispatchEvent(new Event('input', { bubbles: true }));
            timeInput.dispatchEvent(new Event('change', { bubbles: true }));

            pressEnter(timeInput);
            timeInput.blur();

            debugLog(`⏰ Time set to ${formattedTime}`);
            await sleep(200);
        }
    }

    // -----------------------------------------------------------------
    // SUCCESS DIALOG
    // -----------------------------------------------------------------
    class SuccessDialog {
        constructor(raw) { this.raw = raw; }
        async closeDialogButton() { return await waitForElement('tp-yt-iron-icon', this.raw); }
        async close() { click(await this.closeDialogButton()); await sleep(50); debugLog('closed'); }
    }

    // -----------------------------------------------------------------
    // VISIBILITY MODAL
    // -----------------------------------------------------------------
    class VisibilityModal {
        constructor(raw) { this.raw = raw; }

        async radioButtonGroup() { return await waitForElement('tp-yt-paper-radio-group', this.raw); }
        async visibilityRadioButton() {
            const group = await this.radioButtonGroup();
            return [...group.querySelectorAll('tp-yt-paper-radio-button')][VISIBILITY_PUBLISH_ORDER[VISIBILITY]];
        }

        async setVisibility() {
            click(await this.visibilityRadioButton());
            debugLog(`visibility set to ${VISIBILITY}`);
        }

        async setSchedule(targetDate) {
            const schedule = new Schedule(this.raw);
            await schedule.expandScheduleSection();
            await schedule.setDate(targetDate);
            await schedule.setTime(targetDate);
            await schedule.saveSchedule();
        }

        async saveButton() { return await waitForElement('#done-button', this.raw); }
        async isSaved() { await waitForElement('ytcp-video-thumbnail-with-info', document); }
        async dialog() { return await waitForElement('ytcp-dialog.ytcp-video-share-dialog > tp-yt-paper-dialog:nth-child(1)'); }
        async save() {
            click(await this.saveButton());
            await this.isSaved();
            const dialogElement = await this.dialog();
            return new SuccessDialog(dialogElement);
        }
    }

    // -----------------------------------------------------------------
    // DRAFT MODAL
    // -----------------------------------------------------------------
    class DraftModal {
        constructor(raw) { this.raw = raw; }
        async madeForKidsPaperButton() {
            const nthChild = MADE_FOR_KIDS ? 1 : 2;
            return await waitForElement(`tp-yt-paper-radio-button:nth-child(${nthChild})`, this.raw);
        }
        async selectMadeForKids() { click(await this.madeForKidsPaperButton()); }
        async visibilityStepper() { return await waitForElement('#step-badge-3', this.raw); }
        async goToVisibility() {
            click(await this.visibilityStepper()); await sleep(50);
            return new VisibilityModal(this.raw);
        }
    }

    // -----------------------------------------------------------------
    // VIDEO ROW
    // -----------------------------------------------------------------
    class VideoRow {
        constructor(raw) { this.raw = raw; }
        get editDraftButton() { return waitForElement('.edit-draft-button', this.raw, 20); }
        async openDraft() {
            const editButton = await this.editDraftButton;
            click(editButton);
            return new DraftModal(await waitForElement('.style-scope.ytcp-uploads-dialog'));
        }
    }

    function allVideos() { return [...document.querySelectorAll('ytcp-video-row')].map(el => new VideoRow(el)); }

    // -----------------------------------------------------------------
    // MAIN WORKFLOW
    // -----------------------------------------------------------------
    async function publishDrafts() {
        const videos = allVideos();
        if (!videos.length) { console.warn('No editable videos'); return; }
        debugLog(`Found ${videos.length} videos`);

        let scheduled = buildBaseDate(DATE_OFFSET, START_TIME);
        scheduled = ensureFuture(scheduled, MIN_LEAD_MINUTES);

        let count = 0;
        for (let video of videos) {
            if (count >= COUNT) break;

            // Keep each next slot in the future; try not to jump the day unless needed
            if (count > 0) {
                const next = new Date(scheduled.getTime() + GAP_MINUTES * 60000);
                scheduled = ensureFuture(next, 0); // we already have a future baseline
            }

            debugLog(`🗓️ Scheduling #${count + 1} at ${scheduled}`);

            try {
                const draft = await video.openDraft();
                await draft.selectMadeForKids();
                const visibility = await draft.goToVisibility();
                await visibility.setVisibility();
                await visibility.setSchedule(scheduled);

                const dialog = await visibility.save();
                await dialog.close();

                count++;
            } catch (err) {
                console.error('Error publishing draft:', err);
            }
        }
    }

    ({ 'publish_drafts': publishDrafts })[MODE]();
})();
