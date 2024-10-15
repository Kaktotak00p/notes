import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Task {
    id: string;
    content: string;
    completed: boolean;
}

export interface TaskList {
    name: string;
    tasks: Task[];
}

function createTasksStore() {
    const storedTasks = browser ? localStorage.getItem('tasks') : null;
    let initialTasks: TaskList[] = [];

    if (storedTasks) {
        try {
            initialTasks = JSON.parse(storedTasks);
        } catch (error) {
            console.error('Error parsing stored tasks:', error);
            // If there's an error parsing, we'll start with an empty array
        }
    }

    const { subscribe, set, update } = writable<TaskList[]>(initialTasks);

    return {
        subscribe,
        set: (taskLists: TaskList[]) => {
            if (browser) {
                localStorage.setItem('tasks', JSON.stringify(taskLists));
            }
            set(taskLists);
        },
        addTaskList: (name: string) => update(taskLists => {
            if (taskLists.some(list => list.name === name)) {
                throw new Error('A task list with this name already exists');
            }
            const updatedTaskLists = [...taskLists, { name, tasks: [] }];
            if (browser) {
                localStorage.setItem('tasks', JSON.stringify(updatedTaskLists));
            }
            return updatedTaskLists;
        }),
        addTask: (listName: string, task: Task) => update(taskLists => {
            const updatedTaskLists = taskLists.map(list =>
                list.name === listName ? { ...list, tasks: [...list.tasks, task] } : list
            );
            if (browser) {
                localStorage.setItem('tasks', JSON.stringify(updatedTaskLists));
            }
            return updatedTaskLists;
        }),
        updateTask: (listName: string, taskId: string, updates: Partial<Task>) => update(taskLists => {
            const updatedTaskLists = taskLists.map(list =>
                list.name === listName ? {
                    ...list,
                    tasks: list.tasks.map(task =>
                        task.id === taskId ? { ...task, ...updates } : task
                    )
                } : list
            );
            if (browser) {
                localStorage.setItem('tasks', JSON.stringify(updatedTaskLists));
            }
            return updatedTaskLists;
        }),
        deleteTask: (listName: string, taskId: string) => update(taskLists => {
            const updatedTaskLists = taskLists.map(list =>
                list.name === listName ? {
                    ...list,
                    tasks: list.tasks.filter(task => task.id !== taskId)
                } : list
            );
            if (browser) {
                localStorage.setItem('tasks', JSON.stringify(updatedTaskLists));
            }
            return updatedTaskLists;
        }),
        deleteTaskList: (listName: string) => update(taskLists => {
            const updatedTaskLists = taskLists.filter(list => list.name !== listName);
            if (browser) {
                localStorage.setItem('tasks', JSON.stringify(updatedTaskLists));
            }
            return updatedTaskLists;
        })
        ,
        toggleTask: (listName: string, taskId: string) => update(taskLists => {
            const updatedTaskLists = taskLists.map(list =>
                list.name === listName ? {
                    ...list,
                    tasks: list.tasks.map(task =>
                        task.id === taskId ? { ...task, completed: !task.completed } : task
                    )
                } : list
            );
            if (browser) {
                localStorage.setItem('tasks', JSON.stringify(updatedTaskLists));
            }
            return updatedTaskLists;
        })
    };
}

export const tasks = createTasksStore();
