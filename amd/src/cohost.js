define(['jquery','jqueryui'], function($,jqui) {

    /**
     * Create tag for container
     *
     * @param string name of co-host
     * @return node of tag
     */
    function createTag (label) {
        var div = $('<div class="tag" >'+label+'</div>');
        
        const closeIcon = $('<i class="material-icons" data-item = "'+label+'"> close </i>');

        div.append(closeIcon);
        return div;
    }

    /**
     * Clear all tags from container
     *
     * @param node alternative host container
     */
    function clearTags (tagContainer) {

       tags = $(tagContainer).find('.tag');
        
       for (var i = 0; i < tags.length; ++i) {
            $(tags[i]).remove();
        };
    }

      /**
     * Add tags to node container
     *
     * @param node container for alternative emails
     * @param object array of nodes {email:,name:} to be made into tags
     */
    function addTags(tagContainer, tagsarray) {

        clearTags(tagContainer);

        var input = $('#id_ac-input');

        for (var i = 0; i < tagsarray.length; ++i) {
            tagContainer.append(createTag(tagsarray[i].name),input);
        };
    }

    function createAlert(inputstring){

        var span = " Warning: "+inputstring+ " should have a licensed or pro Zoom account to be an alternate host.\n";

        if($("#alternative_host_alert").length){
            //$("#alternative_host_alert").text(inputstring);
            $("#alternative_host_alert").append('<span id='+inputstring+'>'+span+'</span>');

        }else{
            $('.tag-container').after(
            '<div id="alternative_host_alert" class="alert alert-warning\" role="alert">'+
            '<span id='+inputstring+'>'
            
            +span+'</span></div>');
        }
    }
      /**
     * Add emails selected into hidden import for form processing
     *
     * @param object array of nodes {email:,name:} to be made into tags
     */
    function addEmails (tagsarray) {
    
        var input = $('#id_cohostid');
        input.val(""); 
        var inputstring ="";
        $("#alternative_host_alert").empty();
       
        for (var i = 0; i < tagsarray.length; ++i) {
            if(tagsarray[i]!= "0" && tagsarray[i] != 0  ){
                inputstring += tagsarray[i].email+',';
                res = tagsarray[i].email.split("@");
                if(res[1]!= "uregina.ca"){
                    createAlert(tagsarray[i].email);
                }
            }
        }

        if(inputstring != "")
            input.val(inputstring);

            
            if($("#alternative_host_alert").length ){
                if($("#alternative_host_alert").children().length <= 0){
                        $("#alternative_host_alert").remove();
                }
            }
    }

        /**
     * Remove email from hidden import for form processing
     *
     * @param string email of deleted tag
     */
    function deleteEmail (value) {
    
        var input = $('#id_newcohost');
        selected = input.val().split(/\s*,\s*/);

        value= value.trim();
        
        input.val("");

        for (var i = 0; i < selected.length; ++i) {
            if(selected[i] !==""){
                if(selected[i] !== value){
                    input.val(value+",");
                }
            }
        }

        if($("#"+value).length)
        {
            $("#"+value).remove();
           if($("#alternative_host_alert").children().length <= 0){
                $("#alternative_host_alert").remove();
           }
        }
    }

    return {
        init: function(ogteachers, cohosts) {
            
            var tagfill=[];
            var tagsarray =[];
            tagfill.length=0;

            //check if anything is in hidden element if so add to tag array and fill tagfill with og
            var cohostNode = $('#id_cohostid').val();

            if(cohostNode.length !=0){
                var cohostsInput = cohostNode.split(/\s*,\s*/);

                //for any emails in node
                for (var i = 0; i < cohostsInput.length; ++i) {
                    //Go through og array to find teacher ids to attach
                    if(cohostsInput[i] !=""){
                        name =cohostsInput[i];

                        for (var j = 0; j < ogteachers.length; ++j) {

                            if(ogteachers[j].email === cohostsInput[i])
                                name = ogteachers[j].name
                        };
                        tagsarray.push({email: cohostsInput[i], name: name});
                    }
                }
               
                //compare tags that are in the container, add to drop down list if not a tag
                for (var i = 0; i < ogteachers.length; ++i) {
                    contains=false;
                    for (var j = 0; j < tagsarray.length; ++j) {

                        if(tagsarray[j].email == ogteachers[i].email)
                            contains = true;
                    }
                    if(!contains)
                        tagfill.push(ogteachers[i].name);  
                }
            }else if(cohosts.length ==0){
                //if no cohosts are currently added 
                for (var i = 0; i < ogteachers.length; ++i) {
                    tagfill.push(ogteachers[i].name);
                }     
            }else{ //if cohosts are already in zoom meeting (if editng meeting)
                tagsarray = cohosts;
                for (var i = 0; i < ogteachers.length; ++i) {
                    var contains =false;
                    for (var j = 0; j < cohosts.length; ++j) {
                        if(cohosts[j].email == ogteachers[i].email)
                            contains = true;
                    }
                    if(!contains){
                        tagfill.push(ogteachers[i].name);
                    }
                }
            }

            
            const tagContainer = $('.tag-container');
            var child = tagContainer.find('.col-md-3');
            child.removeClass('col-md-3');
             //check if error has been sent back for alternative host
             if($('#id_error_ac-input').css('display') == 'block'){
                tagContainer.addClass("border-danger");
            }else{
                tagContainer.removeClass("border-danger");
            }

            var inputNode = $('#id_ac-input');

            //clear any input in case of refresh
            $('#id_newcohost').val("");
            addTags(tagContainer,tagsarray);  
            addEmails(tagsarray);  

            //if container is clicked show drop down list
            tagContainer.click(function(){
                $(inputNode).autocomplete("search", "");
                inputNode.focus();

            });

            //If Assigned Teacher is switch remove from alternative host options
            //One first load remove whichever is selected
            assignNode = $('#id_teacherid');
            var previousAssign=jQuery("#id_teacherid option:selected").text();

            temp=[];
            for (var i = 0; i < tagfill.length; ++i) {

                if(tagfill[i] !== previousAssign){
                    temp.push(tagfill[i]);
                }
            }
            tagfill = temp;

            assignNode.on('focus', function () {
                // Store the current value on focus and on change
                previousAssign = jQuery("#id_teacherid option:selected").text();

            }).change(function(e) {

                var assignName = jQuery("#id_teacherid option:selected").text();

                for (var i = 0; i < ogteachers.length; ++i) {
                    if(assignName == ogteachers[i].name)
                        var newHost = ogteachers[i].email;
                };

                //remove current assigned instructor from list
                temp=[];
                for (var i = 0; i < tagfill.length; ++i) {

                    if(tagfill[i] !== assignName){
                        temp.push(tagfill[i]);
                    }
                }
                
                tagfill = temp;
                //push old assigned instructor to the list
                if(previousAssign != undefined && jQuery.inArray(previousAssign, tagfill) === -1)
                    tagfill.push(previousAssign);

                $(inputNode).autocomplete('option', 'source', tagfill);

                //remove new assigned instructor from tagarray if in
                temp=[];
                for (var i = 0; i < tagsarray.length; ++i) {

                    if(tagsarray[i].name != assignName)
                        temp.push(tagsarray[i]);
                }

                tagsarray =temp;

                addTags(tagContainer,tagsarray);    
                addEmails(tagsarray);

            });


            $("body").click( function (e) {

                //check if it is a node being removed
                if (e.target.tagName === 'I') {
                    var tagLabel = e.target.getAttribute('data-item');
                    var contains =true;

                    for (var i = 0; i < tagfill.length; ++i) {

                        if(tagfill[i]===tagLabel)
                            contains = false;
                    };

                    if(contains){
                        tagfill.push(tagLabel);
                    }

                    temp=[];
                    for (var i = 0; i < tagsarray.length; ++i) {
                    
                        if(tagsarray[i].name !== tagLabel){
                            temp.push(tagsarray[i]);
                        }else{
                            //clear email if match and email is 0
                            if(tagsarray[i].email==0){
                                deleteEmail(tagsarray[i].name);
                            }
                        }
                    }

                    //add any typed input into tags 
                    tagsarray = temp;
    
                    addTags(tagContainer,tagsarray);    
                    addEmails(tagsarray);
                    $(inputNode).autocomplete("search", "");
                    inputNode.focus();
                }

                //if anything has been typed in added it to the tag
                newtag = $(inputNode).val();
                if(newtag != ""){
                  
                    //check if already in array
                    var contains = false;
                    for (var i = 0; i < tagsarray.length; ++i) {
                        if(tagsarray[i].name == newtag){
                            contains =true;
                        }
                    }

                    //if not then push it 
                    if(!contains){
                        tagsarray.push({email: newtag, name: newtag}); 
                        addTags(tagContainer,tagsarray);
                        addEmails(tagsarray);
                    }
                    inputNode.val("");
                }
            });

          
            // When the input node receives focus, send an empty query to display the full
            // list of tag suggestions.
            inputNode.on('keyup', function(e) {
                
                //on space bar click
                if (e.keyCode == 32) {

                    newtag = $(e.target).val();
                    tagsarray.push({email: newtag, name: newtag});
                    
                    addTags(tagContainer,tagsarray);
                    addEmails(tagsarray);
                  
                    inputNode.val("");
                }else if(e.keyCode == 8 || e.keyCode == 46){
                    if($(e.target).val() == "" && tagsarray !=0){

                        var tagLabel = tagsarray[tagsarray.length-1];

                        //remove last tag in view
                        tagfill.push(tagLabel.name);
                        $(inputNode).autocomplete('option', 'source', tagfill);
                    
                        tagsarray.splice(-1,1)

                        addTags(tagContainer,tagsarray);    
                        addEmails(tagsarray);
                        inputNode.focus();
                    }
                } else if(e.keyCode == 13) { //if enter key is clicked prevent form from submitting if in node
                    if($(inputNode).val().length==0) {
                        inputNode.focus();
                        event.preventDefault();
                        return false;
                    }
                  }
            });


            $(inputNode).autocomplete({
                source: tagfill,
                minLength: 0,
                autoFocus: true,
                select: function(event, ui) {
    
                    value = ui.item.value;
            
                    if (value != "") {
                            
                        var contains =true;
                        for (var i = 0; i < tagsarray.length; ++i) {
                            if(tagsarray.name===value)
                                contains= false;
                        };

                        if(contains){
                            //Go through og array to find teacher ids to attach
                            teacheremail=value;

                            for (var i = 0; i < ogteachers.length; ++i) {
                                if(ogteachers[i].name === value)
                                    teacheremail = ogteachers[i].email
                            };

                            for (var i = 0; i < cohosts.length; ++i) {
                                if(cohosts[i].name === value)
                                    teacheremail = cohosts[i].email
                            };

                            temp=[];
        
                            tagfill = jQuery.grep(tagfill, function(element) {
                                return element != value;
                            }); 

                            $(inputNode).autocomplete('option', 'source', tagfill);

                            if(!tagsarray){
                                tagsarray = [];
                            }
                            tagsarray.push({email: teacheremail, name: value});
                            
                            addTags(tagContainer,tagsarray);
                            addEmails(tagsarray);
                            inputNode.val("");
                        }
                    }
                    inputNode.val("");  
                    inputNode.focus();
                    $(inputNode).autocomplete("search", "");

                    return false;
                },
              }).focus(function () {
                $(this).autocomplete("search");
            });
        }
    };

});