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
 * Scheduler calendar exception dates setting.
 *
 * @package    mod_scheduler
 * @copyright  2025 John Lane
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_scheduler\settings;


/**
 * Scheduler calendar exception dates setting. Just a regular admin_setting_configtext with custom validation.
 *
 * @package    mod_scheduler
 * @copyright  2025 John Lane
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class admin_setting_datelist extends \admin_setting_configtext {

    /**
     * Validate data before storage
     *
     * @param string $data data
     * @return mixed true if ok string if error found
     */
    public function validate($data) {
        $datelist = explode(',', $data);
        foreach ($datelist as $date) {
            $date = trim($date);
            $datetime = \DateTimeImmutable::createFromFormat('Y-m-d', $date);
            if ($datetime === false) {
                return get_string('calendarexception_error', 'mod_scheduler');
            }
        }

        // If validation passes, you can perform parent validation or return the data
        return parent::validate($data);
    }
}
