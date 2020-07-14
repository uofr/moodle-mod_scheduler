YUI.add('moodle-mod_scheduler-zoom', function (Y, NAME) {

var SELECTORS = {
        CHECKBOXES: '#id_addzoom',
        DIV: 'addzoomvalue',
        EDITOR: '#id_notes_editoreditable', 
        TEACHER: 'teacherid',
        CANCEL: '#id_cancel',
        ERROR: '#id_error_addzoom'
    },
    MOD;
 
M.mod_scheduler = M.mod_scheduler || {};
MOD = M.mod_scheduler.zoom = {};

/**
 * creates a new zoom meeting for the teacher
 *
 * @param cmid the coursemodule id
 * @param spinner The spinner icon shown while saving
 * @return void
 */
MOD.create_new = function(cmid, spinner) {

    teacherid= Y.one('[name="teacherid"]').get("value");
    ogmeeting= Y.one('[name="addzoomog"]').get('value');

    Y.io(M.cfg.wwwroot + '/mod/scheduler/ajax.php', {
        // The request paramaters.
        data: {
        	action: 'addzoom',
            id: cmid,
            teacherid : teacherid,
            zoomid: ogmeeting,
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

                //decode json array output message with zoom link
                var parsedResponse = Y.JSON.parse (xhr.response);
              
                if(parsedResponse.join_url !== undefined){

                   Y.one('#addcohost').removeClass('hidden');
                   
                    Y.all(SELECTORS.ERROR).each( function(box) {
                        box.setStyle('display', 'none');
                        box= Y.all('p').remove();
                    });
                    Y.all(SELECTORS.EDITOR).each( function(box) {
                        box.setContent("<h2>Hello, your link to join the Zoom meeting is below:</h2><br><a href='"+parsedResponse.join_url +"'>"+parsedResponse.join_url+"</a>");
                        box.simulate("blur");
                        box.setStyle("min-height","150px");
                        box.setStyle("height","150px");
                    });

                    Y.one('[name="addzoomvalue"]').set("value",parsedResponse.id);
                }
                else{
                    Y.all(SELECTORS.ERROR).each( function(box) {
                        obj = Y.Node.create('<p>Teacher does not have Zoom Account. Could not create Zoom meeting. </p>');
                        box.insert(obj);
                        box.setStyle('display', 'block');
                    });
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


/**
 *  * Acts as a fake delete... visually interface is changed, but true delete will not occur until
 * submit button is pressed. This removes the need to add back the zoom meeting if form is canceled
 * @return void
 */
MOD.partial_delete = function() {
           
    Y.one('#addcohost').addClass('hidden');
   
    Y.all(SELECTORS.EDITOR).each( function(box) {
        box.setHTML("");
        box.simulate("blur");
    });

    Y.one('[name="addzoomvalue"]').set("value",0 );
};


/**
 * If zoom meeting has been added, but then form is cancelled remove zoom meeting created
 *
 * @param cmid the coursemodule id
 * @param id of zoom meeting created 
 * @return void
 */
MOD.full_delete = function(cmid, id,spinner) {

    Y.io(M.cfg.wwwroot + '/mod/scheduler/ajax.php', {
        // The request paramaters.
        data: {
        	action: 'deletezoom',
            id: cmid,
            zoomid: id,
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

                Y.all(SELECTORS.EDITOR).each( function(box) {
                    box.setHTML("");
                    box.simulate("blur");
                });

                Y.one('[name="addzoomvalue"]').set("value",0 );

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
        //check if box is checked if so remove hidden class from options
        if(box.get("checked")){
            Y.one('#addcohost').removeClass('hidden');
        }

		box.on('change', function(e) {
            var spinner = M.util.add_spinner(Y, box.ancestor('div'));
        
            changed = Y.one('[name="addzoomvalue"]').get('value');
            og = Y.one('[name="addzoomog"]').get('value');

            if(box.get("checked")){
                M.mod_scheduler.zoom.create_new(cmid, spinner);
            }else if(og==0 && changed !=0){
                M.mod_scheduler.zoom.full_delete(cmid,changed,spinner);
            }else{
                M.mod_scheduler.zoom.partial_delete();
            }
		})
    });
    
    //cancel form button if click call cancel zoom button
    Y.all(SELECTORS.CANCEL).each( function(box) {
		box.on('change', function(e) {

            var spinner = M.util.add_spinner(Y, box.ancestor('div'));
            changed = Y.one('[name="addzoomvalue"]').get('value');
            og = Y.one('[name="addzoomog"]').get('value');

            if(og==0 && changed !=0)
                M.mod_scheduler.zoom.full_delete(cmid,changed,spinner);
        })
    });
};


}, '@VERSION@', {"requires": ["base", "node", "event"]});
