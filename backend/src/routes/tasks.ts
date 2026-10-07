import { Router, Request, Response } from 'express';
import { db } from '@/lib/db';
import { taskCreateSchema } from '@/lib/validation';
import { TaskStatus, Priority } from '@prisma/client';

const router = Router();

// Create task
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const validated = taskCreateSchema.parse(req.body);

    const task = await db.task.create({
      data: {
        vendorId: validated.vendorId,
        title: validated.title,
        description: validated.description,
        priority: validated.priority as Priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        status: TaskStatus.PENDING,
      },
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    });
  }
});

// Get vendor tasks
router.get('/vendors/:vendorId/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await db.task.findMany({
      where: { vendorId: req.params.vendorId },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tasks',
    });
  }
});

// Update task status
router.patch('/tasks/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!Object.values(TaskStatus).includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const task = await db.task.update({
      where: { id: req.params.id },
      data: {
        status,
        completedAt: status === TaskStatus.COMPLETED ? new Date() : null,
      },
    });

    res.json({ success: true, task });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    });
  }
});

// Get all pending tasks
router.get('/tasks/pending', async (req: Request, res: Response) => {
  try {
    const tasks = await db.task.findMany({
      where: {
        status: {
          in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Get pending tasks error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pending tasks',
    });
  }
});

// Delete task
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    await db.task.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task',
    });
  }
});

export default router;
