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
  
        //check if meeting already exists for this slot
        $zoomid= required_param('zoomid', PARAM_INT);
        //if so snag info
        if($zoomid!= 0){
            $return = zoomscheduler_get_zoom_meeting($zoomid);
        }else{
            //else create new meeting
            $teacherid = required_param('teacherid', PARAM_INT);
            //check if teacher has zoom account 
            $zoomuserid = zoomscheduler_get_user($teacherid);
            if(!$zoomuserid){
                $return = false;
            }else{
                $formdata = new stdClass();
                $formdata->duration= 60;
                $formdata->start_time = time();

                //Add a temp slotid update after full submit
                $zoommeeting = zoomscheduler_create_zoom_meeting($formdata, $zoomuserid, $cm, $course, 0);

                $return = $zoommeeting;
            }
        }

    break;

    case 'deletezoom':

        $id = required_param('zoomid', PARAM_INT);
        //call to delete instance
        zoomscheduler_delete_zoom_meeting($id);

    break;
}

echo json_encode($return);
die;
