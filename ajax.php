<?php

/**
 * Process ajax requests
 *
 * @package    mod_scheduler
 * @copyright  2014 Henning Bostelmann and others (see README.txt)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once('locallib.php');

//call zoom page
require_once((dirname(dirname(__FILE__))).'/zoom/lib.php');
require_once((dirname(dirname(__FILE__))).'/zoom/locallib.php');

$id = required_param('id', PARAM_INT);
$action = required_param('action', PARAM_ALPHA);

$cm = get_coursemodule_from_id('scheduler', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$scheduler = scheduler_instance::load_by_coursemodule_id($id);

require_login($course, true, $cm);
require_sesskey();

$return = 'OK';

switch ($action) {
    case 'saveseen':

        $appid = required_param('appointmentid', PARAM_INT);
        $slotid = $DB->get_field('scheduler_appointment', 'slotid', array('id' => $appid));
        $slot = $scheduler->get_slot($slotid);
        $app = $slot->get_appointment($appid);
        $newseen = required_param('seen', PARAM_BOOL);

        if ($USER->id != $slot->teacherid) {
            require_capability('mod/scheduler:manageallappointments', $scheduler->context);
        }

        $app->attended = $newseen;
        $slot->save();

        break;
    case 'addzoom':
  
        $teacherid = required_param('teacherid', PARAM_INT);
        $teacher =  $DB->get_record('user', array('id' => $teacherid), '*', MUST_EXIST);
    
        $required=true;
        $cache = cache::make('mod_zoom', 'zoomid');

        if (!($zoomuserid = $cache->get($teacherid))) {
            $zoomuserid = false;
            $service = new mod_zoom_webservice();
                   
            try {
                $zoomuser = $service->get_user($teacher->email);

                if ($zoomuser !== false) {
                    $zoomuserid = $zoomuser->id;
                 }
            } catch (moodle_exception $error) {
                if ($required) {
                    throw $error;
                } else {
                    $zoomuserid = $zoomuser->id;
                }
            }
            $cache->set($teacherid, $zoomuserid);
        }
           
        if($zoomuserid==false){
            $return = "User does not have a zoom account";
            echo json_encode($return);
            die;
        }

        //create array similar to zoom array
        $zoom = new stdClass();
        $zoom->name = "Scheduler Zoom Meeting";
        $zoom->showdescription=0;
        $zoom->start_time=time();
        $zoom->duration= 3600;
        $zoom->recurring=0;
        $zoom->webinar=0;
        $zoom->password= "";
        $zoom->option_host_video=1;
        $zoom->option_participants_video=1;
        $zoom->option_audio="both";
        $zoom->option_jbh=1;
        $zoom->alternative_hosts=null;
        $zoom->meeting_id = -1;
        $zoom->host_id = $zoomuserid;
        $zoom->grade=0;
        $zoom->grade_rescalegrades =null;
        $zoom->gradepass =null;
        $zoom->visible=1;
        $zoom->visibleoncoursepage=1;
        $zoom->cmidnumber=null;
        $zoom->availabilityconditionsjson = array("op"=>"&","c"=>[],"showc"=>[]);  
        $zoom->tag =   array();
        $zoom->course = $course->id;
        $zoom->coursemodule = $cm->id;
        $zoom->section =0;
        $zoom->module = null;
        $zoom->instance =null;
        $zoom->add = "zoom";
        $zoom->update =0;
        $zoom->return =0;
        $zoom->sr =0;
        $zoom->submitbutton =null;
        $zoom->groupingid =0;
        $zoom->completion =0;
        $zoom->completionview =0;
        $zoom->completionexpected =0;
        $zoom->completiongradeitemnumber=null;
        $zoom->conditiongradegroup= array();
        $zoom->conditionfieldgroup = array();
        $zoom->groupmode =0;
        $zoom->intro =null;
        $zoom->introformat =1;
        

        //send it to zoom add_instance
       $returnid = zoom_add_instance($zoom);

        //take return id and do db call to find link
       $zoommeeting  = $DB->get_record('zoom', array('id' => $returnid), '*', MUST_EXIST);
       $return = $zoommeeting;

    break;

    case 'deletezoom':

        $id = required_param('zoomid', PARAM_INT);
        //call to delete instance
        $deleted = zoom_delete_instance($id);

    break;
}

echo json_encode($return);
die;
