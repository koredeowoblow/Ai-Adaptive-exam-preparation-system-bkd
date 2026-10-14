import mongoose from 'mongoose';
import { Topic } from '../src/models/topic.model';
import { Course } from '../src/models/course.model';
import { topicRepository } from '../src/repositories/topic.repository';
import { env } from '../src/config/env';
import { redisClient } from '../src/utils/cache';

describe('Topic Repository Cache Invalidation Tests', () => {
  let course: any;
  let otherCourse: any;

  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_URI);
    if (redisClient.status !== 'ready') {
      await redisClient.connect().catch(() => {});
    }
    await redisClient.flushall();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    redisClient.disconnect();
  });

  beforeEach(async () => {
    await Topic.deleteMany({});
    await Course.deleteMany({});
    await redisClient.flushall();

    course = await Course.create({
      code: 'CS102',
      title: 'Data Structures',
      description: 'Test',
      departmentId: new mongoose.Types.ObjectId(),
    });

    otherCourse = await Course.create({
      code: 'CS103',
      title: 'Algorithms',
      description: 'Test',
      departmentId: new mongoose.Types.ObjectId(),
    });
  });

  it('should invalidate cache when a new topic is created', async () => {
    // 1. Initial fetch (populates cache with empty list)
    const initialList = await topicRepository.findByCourseId(course._id.toString());
    expect(initialList.length).toBe(0);

    // 2. Create topic in course
    const newTopic = await topicRepository.create({
      courseId: course._id,
      name: 'Binary Trees',
      order: 1,
    });

    // 3. Fetch again -> must hit fresh data, not cached empty list
    const freshList = await topicRepository.findByCourseId(course._id.toString());
    expect(freshList.length).toBe(1);
    expect(freshList[0].name).toBe('Binary Trees');
  });

  it('should invalidate cache when a topic is updated', async () => {
    const topic = await topicRepository.create({
      courseId: course._id,
      name: 'Old Name',
      order: 1,
    });

    // Warm cache
    const cachedList = await topicRepository.findByCourseId(course._id.toString());
    expect(cachedList[0].name).toBe('Old Name');

    // Update topic name
    await topicRepository.updateById(topic._id.toString(), {
      name: 'Updated Name',
    });

    // Fetch again -> must show updated name
    const freshList = await topicRepository.findByCourseId(course._id.toString());
    expect(freshList.length).toBe(1);
    expect(freshList[0].name).toBe('Updated Name');
  });

  it('should invalidate both old and new course caches when topic moves between courses', async () => {
    const topic = await topicRepository.create({
      courseId: course._id,
      name: 'Dynamic Programming',
      order: 1,
    });

    // Warm both caches
    const course1List = await topicRepository.findByCourseId(course._id.toString());
    const course2List = await topicRepository.findByCourseId(otherCourse._id.toString());
    expect(course1List.length).toBe(1);
    expect(course2List.length).toBe(0);

    // Move topic to otherCourse
    await topicRepository.updateById(topic._id.toString(), {
      courseId: otherCourse._id,
    });

    // Both caches must be invalidated
    const freshCourse1 = await topicRepository.findByCourseId(course._id.toString());
    const freshCourse2 = await topicRepository.findByCourseId(otherCourse._id.toString());
    expect(freshCourse1.length).toBe(0);
    expect(freshCourse2.length).toBe(1);
    expect(freshCourse2[0].name).toBe('Dynamic Programming');
  });

  it('should invalidate cache when a topic is deleted', async () => {
    const topic = await topicRepository.create({
      courseId: course._id,
      name: 'Graph Traversal',
      order: 1,
    });

    // Warm cache
    const warmed = await topicRepository.findByCourseId(course._id.toString());
    expect(warmed.length).toBe(1);

    // Delete topic
    await topicRepository.deleteById(topic._id.toString());

    // Fetch again -> cache must be cleared and return 0
    const freshList = await topicRepository.findByCourseId(course._id.toString());
    expect(freshList.length).toBe(0);
  });
});
