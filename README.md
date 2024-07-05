# project-clock

A simple CLI app for clocking time spent on a project.

## Installation

Install the package globally.

```sh
npm install -g project-clock
```

## Usage

### Creating a new timesheet

Create a new timesheet file for your project with the `new` command:

```sh
~/projects/testproject$ pclock new
project name: (testproject)
```

If no parameters are provided, application prompts for the name of the project. Default value is the name of the parent directory.

You can also give the project name as a parameter:

```sh
pclock new testproject
```

or just start the clock using the `start` command:

```sh
pclock start
```

If there is no timesheet file in the directory, a new one is created and a prompt asking for the project name is shown.

A timesheet is essentially a json file with a name following this pattern: _pclock-<project_name>.json_.

### Starting and stopping the clock and describing the tasks

Use the `start` command to start the clock:

```sh
pclock start [<subject>]
```

With `start` wtihout any parameters, current timestamp is used as the subject for the task. You may also write the subject directly after the `start` command in quotes:

```sh
pclock start 'Implement clock functions'
```

After a task is started, its subject can be set with the `set-subject` command:

```sh
pclock set-subject 'Implement clock functions'
```

When the work is done, the clock can be stopped with the `stop` command:

```sh
pclock stop [<task>]
```

Stop command marks the task as complete. Clock can also be paused with the `pause` (alias `suspend`) command:

```sh
pclock pause [<task>]
```

This suspends the task, meaning it is not shown complete in the listings of the timesheet. Paused clock can be unpaused with `unpause` (alias `resume`) command:

```sh
pclock unpause [<task>]
```

The task being stopped, paused or unpaused can be specified with a regular expression that matches the tasks subject. If task is not specified the command affects the last started or the last stopped task (in this order).

A longer description of the task can be specified using the `--description` option, which can also be used with start and stop commands:

```sh
pclock stop --description 'Create a skeleton with empty function definitions.'
```

There is also a `set-description` command that can be used for setting the message of the last started or the last stopped task:

```sh
pclock set-description 'Create a skeleton with empty function definitions.'
```

New lines can be appended to the description with the `append` command:

```sh
pclock append [--paragraph] 'Create a test for start function and implement the function.'
```

If the `--paragraph` option is used two line breaks are added before the new string.

### Editing older task descriptions

`Stop`, `pause` and `unpause` commands accept a task specifier as a parameter. Without it they will affect the last started (not complete) or last completed task. It is also possible to specify the task for commands like `set-subject` or `set-description` that do not accept a task specifier as parameter, with the `--task` option:

```sh
pclock set-subject 'Designing the basic structure' --task 'Creating the basic structure'
```

Sets the subject for a task whose previous subject matches with "Creating the basic structure". Following command appends new text as a new paragraph to the description of a task with a subject starting with "Creating the":

```sh
pclock set-description -p --task '^Creating the' 'Defining the basic structure of the project using key user stories ...'
```

### Listing tasks and project statistics

Command `ls-tasks` (alias `lst`) lists the tasks on the timesheet along with the times spent on them:

```sh
pclock ls-tasks [--complete | --started | --not-started]
```

Options can be used for narrowing the set of listed tasks.

### Getting current status

The tasks that have been started but are still incomplete, along with some other status information, can be listed with the `status` command:

```sh
pclock status
```

The other status information consists of, e.g., the number of complete and incomplete tasks on the timesheet.
