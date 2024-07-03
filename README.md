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

If there is no timesheet file in the directory, a new one is created and the prompt asking for the project name is shown.

A timesheet is essentially a json file with a name following this pattern: _pclock-<project_name>.json_.

### Starting and stopping the clock and describing the tasks

Use the `start` command to start the clock:

```sh
pclock start
```

This starts a new task (or record), which is reported as a single unit on the timesheet. A short heading describing the task can be specified using the `--task` option:

```sh
pclock start --task 'Implement clock functions'
```

After starting a task, the heading can be set with the `set-task` command:

```sh
pclock set-task 'Implement clock functions'
```

When the work is done, the clock can be stopped with the `stop` command:

```sh
pclock stop
```

A longer message describing the task can be specified using the `--message` option, which can be used with the stop or the start command:

```sh
pclock stop --message 'Create a skeleton with empty function definitions.'
```

There is also a `set-message` command that can be used for setting the message of the currently active or the last stopped task:

```sh
pclock set-message 'Create a skeleton with empty function definitions.'
```

New lines can be added to the message of the currently active or the last stopped task with the `append` command:

```sh
pclock append 'Create a test for start function and implement the function.'
```

The last stopped task can be continued with the `resume` command:

```sh
pclock resume
```

When using the `resume` command, the new time period is reported as part of the previous task.

### Editing older task descriptions

As described above, the task headings (specified with the `--task` option) and the task messages (specified with the `--message` option) can be reset by reaplying the same options, or with the `set-task` and the `set-message` commands. New lines can also be added to the messages using the `append` command. These can, however, only be applied to the currently active or the last stopped task. To edit tasks even further back the history, the `edit-task` command can be used.

```sh
pclock edit-task 'Creating the basic structure' --task
```

which continues the task specified by the tasks heading, or

```sh
pclock edit-task oa91ksdkj8
```

which continues the task specified by

## Options
