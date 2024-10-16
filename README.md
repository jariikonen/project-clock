# project-clock

A simple CLI app for clocking time spent on a project.

## Installation

Install the package globally.

```sh
npm install -g project-clock
```

## Usage

```
pclock (Project Clock) v0.0.0

Usage: pclock [options] [command]

CLI app to clock time spent on a project

Options:
  -V, --version                               output the version number
  --no-color                                  turns off the color output
  -h, --help                                  display help for command

Commands:
  new [project_name]                          Create a new project timesheet. Prompts the user for a project name, if the project_name argument is not given.

  start [task_descriptor]                     Start a task. If the command is called without the task descriptor argument, it will first look for any unstarted
                                              tasks. If a single such task is found, the user is asked if this is the one to be started. If more than one such task
                                              are found, user is asked which of the tasks to start. If no unstarted tasks are found, user is asked if a new task
                                              should be created. If user wants to create a new task, user is prompted for a subject for the new task and the
                                              current timestamp is provided as the default subject.

                                              If task descriptor is provided, a task whose subject matches the descriptor is looked for. If such a task is found,
                                              the user is confirmed if it is the right task. If the task is correct, it is started. If such a task is not found,
                                              the user is confirmed whether to create a new task with the task descriptor as its subject. If many tasks match with
                                              the descriptor, user is prompted which of the tasks to start.

  stop [task_descriptor]                      Stop the clock. If the command is called without the task descriptor argument, it will look for active tasks (i.e., a
                                              task that is started but not stopped). If one such task is found, the user is confirmed whether this is the correct
                                              task. If it is, the task is stopped by setting the "end" value of the task to current timestamp. If more than one
                                              such task are found, the user is prompted which one of the tasks to stop. If no such task is found, the command exits
                                              with an error.

                                              If task descriptor is provided, a tasks whose subject matches the descriptor is looked for. If such a task is found
                                              the user is confirmed whether it is the correct task to stop. if it is, the task is stopped. If more than one such
                                              task is found, the user is prompted which one of the tasks to stop. If no such task is found, the command exits with
                                              an error.

  status [options]                            Output status information.

  list|ls [options]                           List tasks on the timesheet.

  suspend|pause [options] [task_descriptor]   Suspend a task.

  resume|unpause [options] [task_descriptor]  Resume a task.

  add [task_subject]                          Add a new task. Prompts the user for a task subject if the task_subject argument is not given.

  show [task_descriptor]                      Display the full task data (subject, description, notes and time data). Prompts the user to select a task if the
                                              task_descriptor argument is not given.

  edit [task_descriptor]                      Edit task. Has three sub commands: "subject", "description" and "notes". "Subject" allows you to edit the subject,
                                              "description" to edit the description, and "notes" to edit the notes on the task indicated by the task_descriptor
                                              argument. Type "help edit" for more information.

  remove|rm [task_descriptor]                 Remove a task from the timesheet.
  help [command]                              display help for command
```
