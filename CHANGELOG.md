# Changelog

## 0.1.0 (2025-02-04)


### Features

* "start", "stop", "suspend" and "resume" commands output status information after successful operation ([72e47a7](https://github.com/jariikonen/project-clock/commit/72e47a7c6213ae053ef2913e1cd61bbedd4107ec))
* add a "list" command to print a list of tasks on a time sheet ([92d5206](https://github.com/jariikonen/project-clock/commit/92d52060292cf621bd04925025040f54e7f176f9))
* add color to the ouput functions (command "show" and side heading functions) ([b500d2c](https://github.com/jariikonen/project-clock/commit/b500d2cfc10500b05c151aaec776c8a03de5e722))
* add command "new" that creates a new timesheet file ([d8ae477](https://github.com/jariikonen/project-clock/commit/d8ae4778c1010aa4aa7c3aa8ec39e4b4c6549695))
* add filter description line to list command and modify how it reports there is nothing to list ([0ff4cf1](https://github.com/jariikonen/project-clock/commit/0ff4cf1d4e22a5190b02150382efef1f166668e2))
* allow task list items to be reordered with command reorder ([79fb682](https://github.com/jariikonen/project-clock/commit/79fb682ee1868c38a00f9cc4e0eb3509a63dccae))
* app name and the current version is printed when the program is run without any parameters or options ([18c0146](https://github.com/jariikonen/project-clock/commit/18c014662d62c0870980938a35bf4982fa10bb5d))
* by default "suspend" and "resume" commands offer only active tasks to be suspend or resumed (can be overridden with -c flag) ([60f4600](https://github.com/jariikonen/project-clock/commit/60f4600bdb59d8aae252820e8f29c42b3ec075cb))
* change flags for the version option ([056e245](https://github.com/jariikonen/project-clock/commit/056e2454883b50d88ad7268f25cc1192abb1f6a0))
* clock can be started and stopped ([663eb60](https://github.com/jariikonen/project-clock/commit/663eb60a1cfd45c379c3e185fbd5c4ed3e70cc99))
* command "new" prompts the user for a project name if it is not given as an argument and uses name of the current working directory as the default value ([f190a4b](https://github.com/jariikonen/project-clock/commit/f190a4bd516ae80a5c4f206c102e0b5d4d212514))
* configure commander output errors in red ([8a23912](https://github.com/jariikonen/project-clock/commit/8a23912f3681f7aee3c9c8a154ca8c6fcaaab639))
* edit command descriptions and prompts of "start" and "stop" commands clearer ([9469aa9](https://github.com/jariikonen/project-clock/commit/9469aa9c2b5e4269f0693b4bcbdd510224c65d67))
* edit functionality of the start command; user is asked to select when there are many options and confirm the action when single match is found ([e853af7](https://github.com/jariikonen/project-clock/commit/e853af72ba3474352e630327a97bd20a6a9a02f8))
* edit functionality of the stop command; user is asked to select when there are many options and to confirm the action when a single match is found ([da8fd0b](https://github.com/jariikonen/project-clock/commit/da8fd0bdbdae992d8959f06744606c4618887d92))
* full task data can be displayed with "show" command ([de9b0f5](https://github.com/jariikonen/project-clock/commit/de9b0f577b2ae4ea286711a06278eddca7b4d2a7))
* full task data can be displayed with "show" command ([f197366](https://github.com/jariikonen/project-clock/commit/f197366d88843204a127dff998990b5c655c4c4f))
* implementation of the status command ([522d06f](https://github.com/jariikonen/project-clock/commit/522d06fc598fe1ef3914cb57a3e43d413f0eb6e5))
* improve "start" and "stop" commands and their tests ([d1b1b8a](https://github.com/jariikonen/project-clock/commit/d1b1b8af3d56ad454fd58ba1cdbf5b1c6ff8c06e))
* improve readability of add and edit command prompts ([f4f52fd](https://github.com/jariikonen/project-clock/commit/f4f52fd80a052b8319151cc2a4d071e7fde45006))
* improve the readability of the prompts of the "new" command ([a561a38](https://github.com/jariikonen/project-clock/commit/a561a38bedeb86aa1eacb131982f79d7075d8c9f))
* improve the readability of the rest of the command's prompts and messages ([67b4193](https://github.com/jariikonen/project-clock/commit/67b41938d78329cbddfef82be38340e655c4c085))
* improved the readability of the prompts of the "resume" and "suspend" commands ([4b376c7](https://github.com/jariikonen/project-clock/commit/4b376c781f2d0a91ad7c8116d6d7396d35138989))
* modify 'status' command so that it won't print additional days-hours-and-minutes string when the total time spent is less than a day ([024f9f7](https://github.com/jariikonen/project-clock/commit/024f9f7bde0433692833d6c8f1544e216e15478d))
* modify "start" and "stop" commands to report the timesheet file errors in a user friendly manner ([79c5c6d](https://github.com/jariikonen/project-clock/commit/79c5c6de8e3aed3cc2ba6fc1236ce28985cb75f1))
* modify the "status" command so that it does not report total time usage when there is none ([91d61ce](https://github.com/jariikonen/project-clock/commit/91d61cee08200f728cc244f7a33496d9bff689dd))
* modify TimePeriod class so that the unit conversion rates can be customized ([1aca79e](https://github.com/jariikonen/project-clock/commit/1aca79eef0d00b969e8cd383354a75d44b0972a7))
* remove cli-table3 from the project and add color to ouput functions with chalk (commands "list" and "status") ([165715a](https://github.com/jariikonen/project-clock/commit/165715af38a9b607d7373db847ecef1fd7b68844))
* status does not put quotes around project name and outputs dash as total time spent when no time has been spent ([d65c0e6](https://github.com/jariikonen/project-clock/commit/d65c0e6f3c8a9ce1d4e461f7fd6135e48d8be19b))
* subject, description and notes of a task can be set and edited ([9fa38f2](https://github.com/jariikonen/project-clock/commit/9fa38f2bb4fbe80a2c85c443176cd9d9c6e62752))
* tasks can be added without starting the clock ([172eae5](https://github.com/jariikonen/project-clock/commit/172eae531ab704b7d69f50a717245acfb03ab260))
* tasks can be removed from the timesheet ([03e7219](https://github.com/jariikonen/project-clock/commit/03e7219c0a2e1e24f515a9921e4df77204140b8c))
* tasks can be resumed ([85e61d9](https://github.com/jariikonen/project-clock/commit/85e61d989b31d3c788db44121c755489b67782c9))
* tasks can be suspended ([5e6052d](https://github.com/jariikonen/project-clock/commit/5e6052dc8d461ecc00d89980d843c840d9fd9aea))
* time unit conversion parameters are read from the time sheet file ([9436606](https://github.com/jariikonen/project-clock/commit/943660685146da9b5794bdfa03ce4d871e58658e))


### Bug Fixes

* app throwing full errors with stack listings when stopping an already stopped task or a task that hasn't been started ([eb1b2a4](https://github.com/jariikonen/project-clock/commit/eb1b2a47af9bf8aba2f6e393ceae6298826bb427))
* calculateTimes() not testing if the suspend and resume fields are arrays or not ([4ecf0a2](https://github.com/jariikonen/project-clock/commit/4ecf0a20d2c77177fb40efbe6b77fe3f0c1ca345))
* getTaskListString()'s simple rendering when the cell content is longer than the column width ([18f3495](https://github.com/jariikonen/project-clock/commit/18f349535109c66b0f2916910abf88f09e0d93a0))
* padding in simple table rendering ([f05b8be](https://github.com/jariikonen/project-clock/commit/f05b8be18c5aac0438cca5008bc6841cb363d2e6))


### Miscellaneous Chores

* release 0.1.0 ([a099b33](https://github.com/jariikonen/project-clock/commit/a099b339b714542b5717c6361a0021a57ca77265))
