YUI.add('moodle-mod_scheduler-saveseen', function (Y, NAME) {

    var SELECTORS = {
            CHECKBOXES: 'table#slotmanager form.studentselectform input.studentselect',
            APCHECKBOX: 'table#slotmanager form.studentselectform input.absentpaid',
            ASCHECKBOX: 'table#slotmanager form.studentselectform input.absentschedule'
        },
        MOD;
     
    M.mod_scheduler = M.mod_scheduler || {};
    MOD = M.mod_scheduler.saveseen = {};
    
    /**
     * Save the "seen" status.
     *
     * @param cmid the coursemodule id
     * @param appid the id of the relevant appointment
     * @param spinner The spinner icon shown while saving
     * @return void
     */
    MOD.save_status = function(cmid, appid, newseen, spinner,action,box) {
    
        Y.io(M.cfg.wwwroot + '/mod/scheduler/ajax.php', {
            // The request paramaters.
            data: {
                action: action,
                id: cmid,
                appointmentid : appid,
                seen: newseen,
                sesskey: M.cfg.sesskey
            },
    
            timeout: 5000, // 5 seconds of timeout.
    
            //Define the events.
            on: {
                start : function(transactionid) {
                    spinner.show();
                },
                success : function(transactionid, xhr) {
                    window.setTimeout(function() {
                        spinner.hide();
                    }, 250);

                    //get the parent of the checkboxes
                    var parent=box.get('parentNode');
                     parent=parent.get('parentNode');
                    //get the children of the parent
                    var attended , absentpaid, absentschedule =null;
                    absentpaid = parent.one('[class="absentpaid"]');
                    absentschedule = parent.one('[class="absentschedule"]');
                    attended = parent.one('[class="studentselect"]');

                    //clear other checkboxes
                    if(action == 'saveseen' && absentpaid != null && absentschedule !=null){
                        absentschedule.set('checked', false);
                        absentpaid.set('checked', false);
                    }else if(action =='absentpaid' && attended != null && absentschedule !=null ){
                        attended.set('checked', false);
                        absentschedule.set('checked', false);
                    }else if (action =='absentschedule' && attended != null && absentpaid !=null){
                        attended.set('checked', false);
                        absentpaid.set('checked', false);
                    }
                },
                failure : function(transactionid, xhr) {
                    var msg = {
                        name : xhr.status+' '+xhr.statusText,
                        message : xhr.responseText
                    };
                    spinner.hide();
                    return new M.core.exception(msg);
                }
            },
            context:this
        });
    };
    
    
    MOD.init = function(cmid) {

        Y.all(SELECTORS.CHECKBOXES).each( function(box) {
            box.on('change', function(e) {
                var spinner = M.util.add_spinner(Y, box.ancestor('div'));
                M.mod_scheduler.saveseen.save_status(cmid, box.get('value'), box.get('checked'), spinner, 'saveseen',box);
            })
        });
        Y.all(SELECTORS.APCHECKBOX).each( function(box) {
            box.on('change', function(e) {
                var spinner = M.util.add_spinner(Y, box.ancestor('div'));
                M.mod_scheduler.saveseen.save_status(cmid, box.get('value'), box.get('checked'), spinner,'absentpaid',box);
            })
        });
        Y.all(SELECTORS.ASCHECKBOX).each( function(box) {
            box.on('change', function(e) {
                var spinner = M.util.add_spinner(Y, box.ancestor('div'));
                M.mod_scheduler.saveseen.save_status(cmid, box.get('value'), box.get('checked'), spinner,'absentschedule',box);
            })
        });
    };
    
    }, '@VERSION@', {"requires": ["base", "node", "event"]});
    