YUI.add("moodle-mod_scheduler-zoom",function(e,t){var n={CHECKBOXES:"#id_addzoom",DIV:"addzoomvalue",EDITOR:"#id_notes_editoreditable",TEACHER:"teacherid",CANCEL:"#id_cancel",ERROR:"#id_error_addzoom"},r;M.mod_scheduler=M.mod_scheduler||{},r=M.mod_scheduler.zoom={},r.create_new=function(t,r){teacherid=e.one('[name="teacherid"]').get("value"),e.io(M.cfg.wwwroot+"/mod/scheduler/ajax.php",{data:{action:"addzoom",id:t,teacherid:teacherid,sesskey:M.cfg.sesskey},timeout:5e3,on:{start:function(e){r.show()},success:function(t,i){window.setTimeout(function(){r.hide()},250);var s=e.JSON.parse(i.response);s.join_url!==undefined?(e.one("#addcohost").removeClass("hidden"),e.all(n.ERROR).each(function(t){t.setStyle("display","none"),t=e.all("p").remove()}),e.all(n.EDITOR).each(function(e){e.setContent("<h2>Hello, your link to join the Zoom meeting is below:</h2><br><a href='"+s.join_url+"'>"+s.join_url+"</a>"),e.simulate("blur"),e.setStyle("min-height","150px"),e.setStyle("height","150px")}),e.one('[name="addzoomvalue"]').set("value",s.id)):e.all(n.ERROR).each(function(t){obj=e.Node.create("<p>Teacher does not have Zoom Account. Could not create Zoom meeting. </p>"),t.insert(obj),t.setStyle("display","block")})},failure:function(e,t){var n={name:t.status+" "+t.statusText,message:t.responseText};return r.hide(),new M.core.exception(n)}},context:this})},r.partial_delete=function(){e.one("#addcohost").addClass("hidden"),e.all(n.EDITOR).each(function(e){e.setHTML(""),e.simulate("blur")}),e.one('[name="addzoomvalue"]').set("value",0)},r.full_delete=function(t,r,i){e.io(M.cfg.wwwroot+"/mod/scheduler/ajax.php",{data:{action:"deletezoom",id:t,zoomid:r,sesskey:M.cfg.sesskey},timeout:5e3,on:{start:function(e){i.show()},success:function(t,r){window.setTimeout(function(){i.hide()},250),e.all(n.EDITOR).each(function(e){e.setHTML(""),e.simulate("blur")}),e.one('[name="addzoomvalue"]').set("value",0)},failure:function(e,t){var n={name:t.status+" "+t.statusText,message:t.responseText};return i.hide(),new M.core.exception(n)}},context:this})},r.init=function(t){e.all(n.CHECKBOXES).each(function(n){n.get("checked")&&e.one("#addcohost").removeClass("hidden"),n.on("change",function(r){var i=M.util.add_spinner(e,n.ancestor("div"));changed=e.one('[name="addzoomvalue"]').get("value"),og=e.one('[name="addzoomog"]').get("value"),n.get("checked")?M.mod_scheduler.zoom.create_new(t,i):og==0&&changed!=0?M.mod_scheduler.zoom.full_delete(t,changed,i):M.mod_scheduler.zoom.partial_delete()})}),e.all(n.CANCEL).each(function(n){n.on("change",function(r){var i=M.util.add_spinner(e,n.ancestor("div"));changed=e.one('[name="addzoomvalue"]').get("value"),og=e.one('[name="addzoomog"]').get("value"),og==0&&changed!=0&&M.mod_scheduler.zoom.full_delete(t,changed,i)})})}},"@VERSION@",{requires:["base","node","event"]});
