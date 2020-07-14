YUI.add('moodle-mod_scheduler-cohost', function (Y, NAME) {

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
 //tags.slice().reverse().each( function(tag) {

 var input = Y.one('#id_ac-input');


 Y.Array.each( tagsarray, function(tag) {
    //tagContainer.prepend(M.mod_scheduler.cohost.createTag(tag));
    tagContainer.insert(M.mod_scheduler.cohost.createTag(tag.name),input);

  });
}

MOD.addIds = function(tagsarray) {
 
  var input = Y.one('#id_cohostid');
  input.set('value',"");
 
  var inputstring ="";
  Y.Array.each( tagsarray, function(tag) {
      inputstring += tag.id+',';
   });

   input.set('value',inputstring);

   console.log("in addids");
   console.log(input.get('value'));

 }

 MOD.addNewEmail = function(value) {
 
  var input = Y.one('#id_newcohost');
  inputvalue = input.get('value');
  value = value.trim();
  input.set('value', inputvalue+','+value);
 }

 MOD.deleteEmail = function(value) {
 
  var input = Y.one('#id_newcohost');
  selected = input.get('value').split(/\s*,\s*/);

  value= value.trim();
  console.log("in delete 1");
  console.log(selected);

  input.set('value',"");
  Y.Array.each(selected, function(email){

    if(email !==""){

     
      if(email !== value){
        input.set('value', value+",");
        console.log("in delete 2");
        console.log(email+"kkk");
        console.log(value+"jjh");
      }
    }

  });

  console.log("in delete 3");
  console.log(input.get('value'));

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

    console.log(tagsarray);
  
   // const input = Y.one('.tag-container input');
    const tagContainer = Y.one('.tag-container');
    var child = tagContainer.one('.col-md-3');

    var tagfill =[];
    child.removeClass('col-md-3');

    //clear any input in case of refresh
    Y.one('#id_newcohost').set('value',"");

    //input.value = '';
    M.mod_scheduler.cohost.addTags(tagContainer,tagsarray);  
    M.mod_scheduler.cohost.addIds(tagsarray);  


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
            //clear email if match and id is 0
            if(p.id==0){
              M.mod_scheduler.cohost.deleteEmail(p.name);
            }
          }
       });

       tagsarray = temp;
       console.log("REMOVE TAGarray2");
       console.log(tagsarray);

        M.mod_scheduler.cohost.addTags(tagContainer,tagsarray);    
        M.mod_scheduler.cohost.addIds(tagsarray);

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
            test=  Y.Array.filter(results, function (result) {
            //return !selected.hasOwnProperty("");
            return !selected.hasOwnProperty(result.text);
          });



           return test;

              //ADDED
                //return selected;
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
           
            tagsarray.push({id: 0, name: newtag});
          
            
            M.mod_scheduler.cohost.addTags(tagContainer,tagsarray);
            M.mod_scheduler.cohost.addIds(tagsarray);
            M.mod_scheduler.cohost.addNewEmail(newtag);
            inputNode.set('value',"");
          }
      });

        // After a tag is selected, send an empty query to update the list of tags.
        inputNode.ac.after('select', function () {
          // Send the query on the next tick to ensure that the input node's blur
          // handler doesn't hide the result list right after we show it.

          values = inputNode.get('value').split(/\s*,\s*/);
          console.log("VALUES");
          console.log(values);
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
              teacherid=0;

              Y.Array.each(ogteachers,function(teacher){

                  if(teacher.name === value)
                    teacherid = teacher.id
              });






              
              temp=[];
              //remove from tagfill
              Y.Array.each(tagfill, function(p){
                if(p.name!==value)
                  temp.push(value); 




              });
              
              tagfill = temp;


              console.log("IN BEFORE ADD");
              console.log(value);

                  //ISSUE HERRE NEED VALUE TO BE ID & NAME
              tagsarray.push({id: teacherid, name: value});

              
              M.mod_scheduler.cohost.addTags(tagContainer,tagsarray);
              M.mod_scheduler.cohost.addIds(tagsarray);
              inputNode.set('value',"");
            }
  
          }
       // });



















          inputNode.set('value',"");
          setTimeout(function () {
            //inputNode.ac.sendRequest('');
           // inputNode.ac.show();
          }, 1);
        });
      });
};




}, '@VERSION@');
