var SELECTORS = {
   
},
MOD;

M.mod_scheduler = M.mod_scheduler || {};
MOD = M.mod_scheduler.cohost = {};

MOD.createTag =function(label) {
 var div = Y.Node.create('<div class="tag" >'+label+'</div>')
 
  const closeIcon = Y.Node.create('<i class="material-icons" data-item = "'+label+'"> close </i>');

  div.append(closeIcon);
  return div;
}

MOD.clearTags=function(tagContainer) {

 tagContainer.all('.tag').each( function(tag) {
   tag.remove();
  });
}

MOD.addTags = function(tagContainer, tagsarray) {
 M.mod_scheduler.cohost.clearTags(tagContainer);

 var input = Y.one('#id_ac-input');

 Y.Array.each( tagsarray, function(tag) {
    tagContainer.insert(M.mod_scheduler.cohost.createTag(tag.name),input);

  });
}

MOD.addEmails = function(tagsarray) {
 
  var input = Y.one('#id_cohostid');
  input.set('value',"");
 
  var inputstring ="";
  Y.Array.each( tagsarray, function(tag) {

      if(tag != "0" && tag != 0  ){
        inputstring += tag.email+',';
      }
   });

   if(inputstring != "")
    input.set('value',inputstring);
 }

 MOD.addNewEmail = function(value) {
 
    var input = Y.one('#id_newcohost');
    inputvalue = input.get('value');
    value = value.trim();
    if(inputvalue ==""){
      input.set('value', value);
    }else{
      input.set('value', inputvalue+','+value);
    }
 }

 MOD.deleteEmail = function(value) {
 
  var input = Y.one('#id_newcohost');
  selected = input.get('value').split(/\s*,\s*/);

  value= value.trim();
  
  input.set('value',"");
  Y.Array.each(selected, function(email){

    if(email !==""){

      if(email !== value){
        input.set('value', value+",");
      }
    }

  });
 }


MOD.init = function(ogteachers, cohosts) {
    
    //if no cohosts are currently added
    if(!cohosts){
      var tagsarray = ogteachers;
    }else{
      var tagsarray = cohosts;
    }

    var teachersnames =[];
    var values=[];

    const tagContainer = Y.one('.tag-container');
    var child = tagContainer.one('.col-md-3');

    var tagfill =[];
    child.removeClass('col-md-3');

    //clear any input in case of refresh
    Y.one('#id_newcohost').set('value',"");

    M.mod_scheduler.cohost.addTags(tagContainer,tagsarray);  
    M.mod_scheduler.cohost.addEmails(tagsarray);  

    Y.Array.each(ogteachers, function(tag){
      teachersnames.push(tag.name);
    });


    Y.one("body").on('click', function (e) {

      if (e.target.get('tagName') === 'I') {
        var tagLabel = e.target.getAttribute('data-item');

        var contains =true;
         Y.Array.each(tagfill, function(p){
            if(p===tagLabel)
              contains = false;
        });

        if(contains){
          tagfill.push(tagLabel);
        }


        temp=[];
         Y.Array.each(tagsarray, function(p){
          //return p !== tagLabel;
          if(p.name !== tagLabel){
            temp.push(p);
          }else{
            //clear email if match and email is 0
            if(p.email==0){
              M.mod_scheduler.cohost.deleteEmail(p.name);
            }
          }
       });

       tagsarray = temp;
  
        M.mod_scheduler.cohost.addTags(tagContainer,tagsarray);    
        M.mod_scheduler.cohost.addEmails(tagsarray);

      }
    })

	  YUI().use('autocomplete', 'autocomplete-filters', 'autocomplete-highlighters', function (Y) {
        var inputNode = Y.one('#id_ac-input');
        inputNode.set('value',"");
        
        
        inputNode.plug(Y.Plugin.AutoComplete, {
          allowTrailingDelimiter: true,
          minQueryLength: 0,
          queryDelay: 0,
          queryDelimiter: ',',
          source: teachersnames,
          resultHighlighter: 'startsWith',
      
          // Chain together a startsWith filter followed by a custom result filter
          // that only displays tags that haven't already been selected.
          resultFilters: ['startsWith', function (query, results) {
            // Split the current input value into an array based on comma delimiters.
            var selected = inputNode.get('value').split(/\s*,\s*/);
            // Convert the array into a hash for faster lookups.
            selected = Y.Array.hash(selected);
      
            // Filter out any results that are already selected, then return the
            // array of filtered results.
            return  Y.Array.filter(results, function (result) {
            //return !selected.hasOwnProperty("");
            return !selected.hasOwnProperty(result.text);
          });
        }]
      });
      
        // When the input node receives focus, send an empty query to display the full
        // list of tag suggestions.
        inputNode.on('focus', function () {
          inputNode.ac.sendRequest('');
          inputNode.set('value',"");
        });
      
        // When the input node receives focus, send an empty query to display the full
        // list of tag suggestions.
        tagContainer.on('click', function () {
          
          inputNode.ac.sendRequest('');
          inputNode.set('value',"");
          inputNode.focus();  
        });


        inputNode.on('keyup', function(e) {
        
          //on space bar click
          if (e.keyCode == 32) {

            newtag = e.target.get("value");
           
            tagsarray.push({email: 0, name: newtag});
            
            M.mod_scheduler.cohost.addTags(tagContainer,tagsarray);
            M.mod_scheduler.cohost.addEmails(tagsarray);
            M.mod_scheduler.cohost.addNewEmail(newtag);
            inputNode.set('value',"");
          }
      });

        // After a tag is selected, send an empty query to update the list of tags.
      inputNode.ac.after('select', function () {
          // Send the query on the next tick to ensure that the input node's blur
          // handler doesn't hide the result list right after we show it.

          values = inputNode.get('value').split(/\s*,\s*/);
          var last =  values.length - 2;
          value = values[last];
        
          if (value != "") {
            
            var contains =true;
            Y.Array.each(tagsarray, function(p){
                if(p.name===value)
                  contains= false;
            });

            if(contains){
              //Go through og array to find teacher ids to attach
              teacheremail="0";

              Y.Array.each(ogteachers,function(teacher){

                  if(teacher.name === value)
                    teacheremail = teacher.email
              });

              temp=[];
              //remove from tagfill
              Y.Array.each(tagfill, function(p){
                if(p.name!==value)
                  temp.push(value); 
              });
              
              tagfill = temp;
              tagsarray.push({email: teacheremail, name: value});

              M.mod_scheduler.cohost.addTags(tagContainer,tagsarray);
              M.mod_scheduler.cohost.addEmails(tagsarray);
              inputNode.set('value',"");
            }
  
          }
          inputNode.set('value',"");
        });
    });
};


