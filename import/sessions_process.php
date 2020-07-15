<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Import attendance sessions class.
 *
 * @package   mod_scheduler
 * @author Chris Wharton <chriswharton@catalyst.net.nz> modifications done by Brooke Clary for scheduler plugin
 * @copyright 2017 Catalyst IT
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/mod/scheduler/model/scheduler_instance.php');

/**
 * Import scheduler slots.
 *
 * @package mod_attendance
 * @author Chris Wharton <chriswharton@catalyst.net.nz>
 * @copyright 2017 Catalyst IT
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class sessions {

    /** @var string $error The errors message from reading the xml */
    protected $error = '';

    /** @var array $sessions The sessions info */
    protected $sessions = array();

    /** @var array $mappings The mappings info */
    protected $mappings = array();

    /** @var int The id of the csv import */
    protected $importid = 0;

    /** @var csv_import_reader|null  $importer */
    protected $importer = null;

    /** @var array $foundheaders */
    protected $foundheaders = array();

    /** @var bool $useprogressbar Control whether importing should use progress bars or not. */
    protected $useprogressbar = false;

    /** @var \core\progress\display_if_slow|null $progress The progress bar instance. */
    protected $progress = null;

    /**
     * Store an error message for display later
     *
     * @param string $msg
     */
    public function fail($msg) {
        $this->error = $msg;
        return false;
    }

    /**
     * Get the CSV import id
     *
     * @return string The import id.
     */
    public function get_importid() {
        return $this->importid;
    }

    /**
     * Get the list of headers required for import.
     *
     * @return array The headers (lang strings)
     */
    public static function list_required_headers() {
        if(SCHEDULER_ZOOM){
            return array(
                get_string('courseshortname', 'scheduler'),
                get_string('schedulername', 'scheduler'),
                get_string('date', 'scheduler'),
                get_string('time', 'scheduler'),
                get_string('duration', 'scheduler'),
                get_string('studentfirstname', 'scheduler'),
                get_string('studentlastname', 'scheduler'),
                get_string('schedulezoom', 'scheduler'),
            );
        }else{
            return array(
                get_string('courseshortname', 'scheduler'),
                get_string('schedulername', 'scheduler'),
                get_string('date', 'scheduler'),
                get_string('time', 'scheduler'),
                get_string('duration', 'scheduler'),
                get_string('studentfirstname', 'scheduler'),
                get_string('studentlastname', 'scheduler'));
        }
    }

    /**
     * Get the list of headers found in the import.
     *
     * @return array The found headers (names from import)
     */
    public function list_found_headers() {
        return $this->foundheaders;
    }

    /**
     * Read the data from the mapping form.
     *
     * @param array $data The mapping data.
     */
    protected function read_mapping_data($data) {
        if ($data) {
            return array(
                'course' => $data->header0,
                'scheduler' => $data->header1,
                'date' => $data->header2,
                'time' => $data->header3,
                'duration' => $data->header4,
                'studentfirstname' => $data->header5,
                'studentlastname' => $data->header6,
                'schedulezoom' => $data->header7
            );
        } else {
            return array(
                'course' => 0,
                'scheduler' => 1,
                'date' => 2,
                'time' => 3,
                'duration' => 4,
                'studentfirstname' => 5,
                'studentlastname' => 6,
                'schedulezoom' => 7,
            );
        }
    }

    /**
     * Get the a column from the imported data.
     *
     * @param array $row The imported raw row
     * @param int $index The column index we want
     * @return string The column data.
     */
    protected function get_column_data($row, $index) {
        if ($index < 0) {
            return '';
        }
        return isset($row[$index]) ? $row[$index] : '';
    }

    /**
     * Constructor - parses the raw text for sanity.
     *
     * @param string $text The raw csv text.
     * @param string $encoding The encoding of the csv file.
     * @param string $delimiter The specified delimiter for the file.
     * @param string $importid The id of the csv import.
     * @param array $mappingdata The mapping data from the import form.
     * @param bool $useprogressbar Whether progress bar should be displayed, to avoid html output on CLI.
     */
    public function __construct($text = null, $encoding = null, $delimiter = null, $importid = 0,
                                $mappingdata = null, $useprogressbar = false) {
        global $CFG;

        require_once($CFG->libdir . '/csvlib.class.php');

        $pluginconfig = get_config('scheduler');

        $type = 'sessions';

        if (! $importid) {
            if ($text === null) {
                return;
            }
            $this->importid = csv_import_reader::get_new_iid($type);

            $this->importer = new csv_import_reader($this->importid, $type);

            if (! $this->importer->load_csv_content($text, $encoding, $delimiter)) {
                $this->fail(get_string('invalidimportfile', 'scheduler'));
                $this->importer->cleanup();
                return;
            }
        } else {
            $this->importid = $importid;

            $this->importer = new csv_import_reader($this->importid, $type);
        }

        if (! $this->importer->init()) {
            $this->fail(get_string('invalidimportfile', 'scheduler'));
            $this->importer->cleanup();
            return;
        }

        $this->foundheaders = $this->importer->get_columns();
        $this->useprogressbar = $useprogressbar;
        $domainid = 1;

        $sessions = array();

        while ($row = $this->importer->next()) {
            // This structure mimics what the UI form returns.
            $mapping = $this->read_mapping_data($mappingdata);

            $session = new stdClass();
            $session->course = $this->get_column_data($row, $mapping['course']);
            if (empty($session->course)) { 
                \mod_scheduler_notifyqueue::notify_problem(get_string('error:sessioncourseinvalid', 'scheduler'));
                continue;
            }

            $session->scheduler = $this->get_column_data($row, $mapping['scheduler']);
            if (empty($session->scheduler)) {
                \mod_scheduler_notifyqueue::notify_problem(get_string('error:sessionschedulerinvalid', 'scheduler'));
                continue;
            }

            // Handle multiple group assignments per session. Expect semicolon separated group names.
           /* $groups = $this->get_column_data($row, $mapping['groups']);
            if (! empty($groups)) {
                $session->groups = explode(';', $groups);
                $session->sessiontype = \mod_attendance_structure::SESSION_GROUP;
            } else {
                $session->sessiontype = \mod_attendance_structure::SESSION_COMMON;
            }*/

            // Expect standardised date format, eg YYYY-MM-DD.
            $sessiondate = strtotime($this->get_column_data($row, $mapping['date']));
            if ($sessiondate === false) {
                \mod_scheduler_notifyqueue::notify_problem(get_string('error:sessiondateinvalid', 'scheduler'));
                continue;
            }
            $session->sessiondate = $sessiondate;

            // Expect standardised time format, eg HH:MM.
            $from = $this->get_column_data($row, $mapping['time']);
            if (empty($from)) {
                \mod_scheduler_notifyqueue::notify_problem(get_string('error:sessionstartinvalid', 'scheduler'));
                continue;
            }
            $from = explode(':', $from);
            $session->sestime['starthour'] = $from[0];
            $session->sestime['startminute'] = $from[1];

            $to = $this->get_column_data($row, $mapping['time']);
            if (empty($to)) {
                \mod_scheduler_notifyqueue::notify_problem(get_string('error:sessionendinvalid', 'scheduler'));
                continue;
            }

            //ADD DURATION 
            $duration = $this->get_column_data($row, $mapping['duration']);
            if (empty($from)) {
                \mod_scheduler_notifyqueue::notify_problem(get_string('error:sessionstartinvalid', 'scheduler'));
                continue;
            }

            //ADD ZOOM 
            if(SCHEDULER_ZOOM){
                $addzoom= $this->get_column_data($row, $mapping['schedulezoom']);
                if (empty($from)) {
                    \mod_scheduler_notifyqueue::notify_problem(get_string('error:sessionstartinvalid', 'scheduler'));
                    continue;
                }
            }

            $session->duration = clean_param($duration, PARAM_INT);
            $session->addzoom = clean_param($addzoom, PARAM_BOOL);
            $session->studentfirstname = format_text($this->get_column_data($row, $mapping['studentfirstname']),FORMAT_PLAIN);
            $session->studentlastname = format_text($this->get_column_data($row, $mapping['studentlastname']),FORMAT_PLAIN);
           
            $session->statusset = 0;

            $sessions[] = $session;
        }
        $this->sessions = $sessions;

        $this->importer->close();
        if ($this->sessions == null) {
            $this->fail(get_string('invalidimportfile', 'scheduler'));
            return;
        } else {
            // We are calling from browser, display progress bar.
            if ($this->useprogressbar === true) {
                $this->progress = new \core\progress\display_if_slow(get_string('processingfile', 'scheduler'));
                $this->progress->start_html();
            } else {
                // Avoid html output on CLI scripts.
                $this->progress = new \core\progress\none();
            }
            $this->progress->start_progress('', count($this->sessions));
            raise_memory_limit(MEMORY_EXTRA);
            $this->progress->end_progress();
        }
    }

    /**
     * Get parse errors.
     *
     * @return array of errors from parsing the xml.
     */
    public function get_error() {
        return $this->error;
    }

    /**
     * Create sessions using the CSV data.
     *
     * @return void
     */
    public function import() {
        global $DB;

        // Count of sessions added.
        $okcount = 0;

        foreach ($this->sessions as $session) {
            $groupids = array();

            // Check course name matches.
            if ($DB->record_exists('course', array(
                'shortname' => $session->course
            ))) {
                // Get course.
                $course = $DB->get_record('course', array(
                    'shortname' => $session->course
                ), '*', MUST_EXIST);
        
                // Check course has activities.
                if ($DB->record_exists('scheduler', array(
                    'course' => $course->id
                ))) {
                    // Translate group names to group IDs. They are unique per course.
                   /* if ($session->sessiontype === \mod_attendance_structure::SESSION_GROUP) {
                        foreach ($session->groups as $groupname) {
                            $gid = groups_get_group_by_name($course->id, $groupname);
                            if ($gid === false) {
                                \mod_attendance_notifyqueue::notify_problem(get_string('sessionunknowngroup',
                                                                            'attendance', $groupname));
                            } else {
                                $groupids[] = $gid;
                            }
                        }
                        $session->groups = $groupids;
                    }*/

                    // Get activities in course.
                    $schedulerdb = $DB->get_records('scheduler', array('course' => $course->id, 'name'=>$session->scheduler), 'id', 'id');
                    $value = reset($schedulerdb);
                    $schedulerdb = current( $schedulerdb);
                    
                    if(! empty($schedulerdb)) {

                        $scheduler = \scheduler_instance::load_by_id($schedulerdb->id);

                        // Build the session data.
                        $cm = get_coursemodule_from_instance('scheduler', $schedulerdb->id, $course->id);
                        if (!empty($cm->deletioninprogress)) {
                            // Don't do anything if this attendance is in recycle bin.
                            continue;
                        }

                        // get teacherid from course
                        $teacher = $DB->get_record_sql(" SELECT c.id, c.shortname, u.id, u.username, u.firstname, u.lastname
                                          FROM mdl_course c 
                                          LEFT OUTER JOIN mdl_context cx ON c.id = cx.instanceid 
                                          LEFT OUTER JOIN mdl_role_assignments ra ON cx.id = ra.contextid AND ra.roleid = '3' 
                                          LEFT OUTER JOIN mdl_user u ON ra.userid = u.id 
                                          WHERE cx.contextlevel = '50' AND c.id =".$course->id.";");
                        

                       
                       
                        //Add zoom meeting if choosen 
                        //ADDED FOR ZOOM
                        $zoommeeting = array();
                        if(SCHEDULER_ZOOM){
                            if($session->addzoom){
                                $host_id = zoomscheduler_hostkey_id($teacher->id);
                                if($host_id){
                                    $zoommeeting = zoomscheduler_create_zoom_meeting($session, $host_id, $cm, $course->id,0);
                                }else{
                                    mod_scheduler_notifyqueue::notify_problem(get_string('error:invalidzoomuser','scheduler', $session->scheduler));
                                }
                            }
                        }
                        //END OF ZOOM ADDED
                        //format slot for DB add
                        $slot = $this->construct_slot_data_for_add($session,$schedulerdb->id, $teacher->id, $zoommeeting);


                        // Check for duplicate sessions.
                        if ($this->session_exists($slot)) {
                            mod_scheduler_notifyqueue::notify_message(get_string('sessionduplicate', 'scheduler', (array(
                                        'course' => $session->course,
                                        'activity' => $cm->name
                            ))));
                            unset($slot);
                        } 
                    
                        if (! empty($slot)) {
                                
                            //Not the best method... with user id would be better
                            $student = $DB->get_record_sql(" SELECT  u.id, u.firstname, u.lastname
                            FROM mdl_user u
                            WHERE u.firstname = '".$session->studentfirstname."' AND u.lastname='".$session->studentlastname."';");

                            //Need a check to see if it is even a student in the course
                            if($this->student_course($course->id, $student->id)){
                                //get new slot id
                                $slotid = $this->add_slot($slot,$scheduler);

                                //Added for zoom
                                if(SCHEDULER_ZOOM && $session->addzoom){
                                    zoomscheduler_update_zoom($zoommeeting->id, $slot);
                                }
                                //End of Added

                                //Add to calendar
                                $this->update_calendar($scheduler,$slot,$teacher,$student,$zoommeeting);


                                //format appointments for DB add
                                $appointment = $this->construct_appointment_data_for_add($session, $slotid, $student->id);
                                //add appointment
                                $context = get_context_instance(CONTEXT_COURSE, $course->id);
                                $this->add_appointment($appointment,$context);
                                $okcount ++;
                            }else{
                                mod_scheduler_notifyqueue::notify_problem(get_string('error:invalidstudent','scheduler', $session->scheduler));
                            }
                        } 
                    }else{
                        mod_scheduler_notifyqueue::notify_problem(get_string('error:invalidschedulername','scheduler', $session->scheduler));
                    }
                } else {
                    mod_scheduler_notifyqueue::notify_problem(get_string('error:coursehasnoattendance','scheduler', $session->course));     
                }
            } else {
                mod_scheduler_notifyqueue::notify_problem(get_string('error:coursenotfound', 'scheduler', $session->course));
            }
        }

        $message = get_string('sessionsgenerated', 'scheduler', $okcount);
        if ($okcount < 1) {
            mod_scheduler_notifyqueue::notify_message($message);
        } else {
            mod_scheduler_notifyqueue::notify_success($message);
        }
    }


    /**
     * Check if student is in the course
     *
     * @param int $courseid 
     * @param int $studentid
     * @return boolean
     */
    private function student_course($courseid, $studentid) {

        $context = get_context_instance(CONTEXT_COURSE, $courseid);
        $students = get_role_users(5 , $context);

        foreach($students as $student){
            if($student->id == $studentid)
                return TRUE;
        }
        return FALSE;
    }

    /**
     * Check if an identical session exists.
     *
     * @param stdClass $session
     * @return boolean
     */
    private function session_exists(stdClass $session) {
        global $DB;

        $check = clone $session;
        // Remove the properties that aren't useful to check.
        unset($check->appointmentlocation);
        unset($check->reuse);
        unset($check->timemodified);
        unset($check->notes);
        unset($check->noteformat);
        unset($check->exclusivity);
        unset($check->emaildate);
        unset($check->hideuntil);
        $check = (array) $check;
      
        if ($DB->record_exists('scheduler_slots', $check)) {
            return true;
        }
        return false;
    }


/**
 * Create the slot to be added to the DB 
 * @param stdClass $formdata moodleform - attendance form.
 * @param int $schedulerid id of scheduler in DB
 * @param int $teacherid of teacher in scheduler
 * @param array $zoom meeting object
 * @return array.
 */

function construct_slot_data_for_add($formdata, $schedulerid, $teacherid, $zoom) {
    global $CFG, $DB;

    $sesstarttime = $formdata->sestime['starthour'] * HOURSECS + $formdata->sestime['startminute'] * MINSECS;
    $sessiondate = $formdata->sessiondate + $sesstarttime;
    $duration = $formdata->duration;

    $sess = array();
    
    $sess = new stdClass();
    //Start with schedulerid
    $sess->schedulerid = $schedulerid;
    //Starttime
    $sess->starttime = $sessiondate;
    //Duration
    $sess->duration = $duration;
    //Teacherid
    $sess->teacherid = $teacherid;
    //Appointment Location
    $sess->appointmentlocation = "";
    //Reuse
    $sess->reuse = 0;
    //timemodified
    $sess->timemodified = time();
    //notes
    $sess->notes = "";
    //notesmodified
    $sess->notesformat = 1;
    //exculsity
    $sess->exclusivity = 1;
    //emaildate
    $sess->emaildate = 0;
    //hideuntil
    $sess->hideuntil = time();

    if(SCHEDULER_ZOOM){
        if(!empty($zoom)){
            $sess->notes = "<h2>".get_string('zoomslotmessage', 'scheduler')."</h2><br><a href=' ".$zoom->join_url."'>".$zoom->join_url."</a>";                    
        }
    }
    return $sess;
}

/**
* Add slot
*
* @param stdClass $sess
* @return int $scheduler
*/
public function add_slot($sess, $scheduler) {
        global $DB;

        $context = get_context_instance(CONTEXT_COURSE, $scheduler->course);
      
        $sess->id = $DB->insert_record('scheduler_slots', $sess);

        //Need to add potential file slot into draft area? for notes, appointment notes, teachernote, studentnote
        $description = file_save_draft_area_files(0,
            $context->id, 'mod_scheduler', 'notes', $sess->id,
            array('subdirs' => false, 'maxfiles' => -1, 'maxbytes' => 0),
            $sess->notes);

        // Trigger a session added event.
        $slotobj = $scheduler->get_slot($sess->id);
        \mod_scheduler\event\slot_added::create_from_slot($slotobj)->trigger();
       
        return $sess->id;
}

     /**
 * Get session data for form.
 * @param stdClass $formdata moodleform - attendance form.
 * @param mod_attendance_structure $att - used to get attendance level subnet.
 * @return array.
 */
function construct_appointment_data_for_add($formdata, $slotid, $studentid) {
    global $CFG;

    $sess = array();
    $sess = new stdClass();
    //Start with slotid
    $sess->slotid = $slotid;
    //student id
    $sess->studentid= $studentid;
    //attended
    $sess->attended = 0;
    //student attended
    $sess->studentattend = 0;
    //Grade can be null
    //appointmentnote can be null
    $sess->appointmentnote = "";
    $sess->appointmentnoteformat = 1;
    //teachernote can be null
    $sess->teachernote = "";
    $sess->teachernoteformat = 1;
    //studentnote can be null
    $sess->studentnote= "";
    $sess->studentnoteformat = 1;

    return $sess;
}

    /**
     * Add single appointment.
     *
     * @param stdClass $sess
     * @return int $sessionid
     */
    public function add_appointment($sess,$context) {
        global $DB;
      
        $sess->id = $DB->insert_record('scheduler_appointment', $sess);
       

        //Need to add potential file slot into draft area? appointment notes, teachernote, studentnote
        $description = file_save_draft_area_files(0,
            $context->id, 'mod_scheduler', 'appointmentnote', $sess->id,
            array('subdirs' => false, 'maxfiles' => -1, 'maxbytes' => 0),
            $sess->appointmentnote);
        
        $description = file_save_draft_area_files(0,
            $context->id, 'mod_scheduler', 'teachernote', $sess->id,
            array('subdirs' => false, 'maxfiles' => -1, 'maxbytes' => 0),
            $sess->teachernote);

        $description = file_save_draft_area_files(0,
            $context->id, 'mod_scheduler', 'studentnote', $sess->id,
            array('subdirs' => false, 'maxfiles' => -1, 'maxbytes' => 0),
            $sess->studentnote);
       
        return $sess->id;
    }

    /**
     * Update calendar events related to this slot
     *
     * @uses $DB
     */
    private function update_calendar($scheduler,$slot,$teacher,$student,$zoom ) {

        global $DB;

        $schedulername = $scheduler->get_name(true);
        $schedulerdescription = $scheduler->get_intro();

        $baseevent = new stdClass();
        $baseevent->description = "$schedulername<br/><br/>$schedulerdescription";
        $baseevent->format = 1;
        $baseevent->modulename = 'scheduler';
        $baseevent->courseid = 0;
        $baseevent->instance = $scheduler->id;
        $baseevent->timestart = $slot->starttime;
        $baseevent->timeduration = $slot->duration * MINSECS;
        $baseevent->visible = 1;

        //ADDED FOR ZOOM
        if(SCHEDULER_ZOOM){
            if(!empty($zoom)){
                $baseevent->description = "$schedulername<br/><br/>$schedulerdescription<br><br> ZOOM Meeting Link: <a href='".$zoom->join_url."'>".$zoom->join_url."</a>";
            }
        }
        //END OF ADDED

        // Update student events.
        $studentevent = clone($baseevent);
        $studenteventname = get_string('meetingwith', 'scheduler').' '.$scheduler->get_teacher_name().', '.fullname($teacher);
        $studentevent->name = shorten_text($studenteventname, 200);

        $this->add_calendar_event( "SSstu:{$slot->id}:{$scheduler->course}", $student->id, $studentevent);

        // Update teacher events.
        $teacherevent = clone($baseevent);
        $teachereventname = get_string('meetingwith', 'scheduler').' '.get_string('student', 'scheduler').', '.fullname($student);
        $teacherevent->name = shorten_text($teachereventname, 200);



    
        $this->add_calendar_event("SSsup:{$slot->id}:{$scheduler->course}", $teacher->id, $teacherevent);
    }

    /**
     * Update a certain type of calendar events related to this slot.
     *
     * @param string $eventtype
     * @param array $userids users to assign to the event
     * @param stdClass $eventdata details of the event
     */
    private function add_calendar_event($eventtype, $userid, stdClass $eventdata) {

        global $CFG, $DB;
        require_once($CFG->dirroot.'/calendar/lib.php');

        $eventdata->eventtype = $eventtype;

        $existingevents = $DB->get_records('event', array('modulename' => 'scheduler', 'eventtype' => $eventtype));
        $handledevents = array();
        $handledusers = array();

        // Add new calendar event.
        if (!in_array($userid, $handledusers)) {
            $thisevent = clone($eventdata);
            $thisevent->userid = $userid;
            calendar_event::create($thisevent, false);
        }

    }
}
