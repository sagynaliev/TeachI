const express = require('express');
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User'); // User моделін импорттау
const Enrollment = require('../models/Enrollment'); // Бір рет импорттау
const Notification = require('../models/Notification');
const { auth, authorize, checkApproval } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/assignments
// @desc    Get assignments for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log(`📌 GET /api/assignments called by user: ${req.user._id}, role: ${req.user.role}`);
    
    let assignments;
    
    if (req.user.role === 'student') {
      // 1. Студенттің тіркелген курсқарын табу
      const enrollments = await Enrollment.find({ 
        student: req.user._id,
        status: { $in: ['enrolled', 'active'] }
      }).populate('course');
      
      console.log(`📌 Student has ${enrollments.length} enrollments`);
      
      const courseIds = enrollments
        .map(enrollment => enrollment.course?._id)
        .filter(id => id);
      
      // 2. Курсқаға тиесілі ассайнменттерді табу
      if (courseIds.length > 0) {
        assignments = await Assignment.find({
          course: { $in: courseIds },
          isPublished: true
        })
        .populate('course', 'title courseCode')
        .populate('instructor', 'firstName lastName')
        .sort({ dueDate: 1 });
      } else {
        assignments = [];
      }
      
    } else if (req.user.role === 'instructor') {
      // Инструкторлар өз ассайнменттерін көреді
      assignments = await Assignment.find({ instructor: req.user._id })
        .populate('course', 'title courseCode')
        .populate('instructor', 'firstName lastName')
        .sort({ dueDate: 1 });
        
    } else if (req.user.role === 'admin') {
      // Админдер барлық ассайнменттерді көреді
      assignments = await Assignment.find({})
        .populate('course', 'title courseCode')
        .populate('instructor', 'firstName lastName')
        .sort({ dueDate: 1 });
    } else {
      return res.status(403).json({ 
        message: 'Access denied. Invalid user role.' 
      });
    }
    
    console.log(`📌 Found ${assignments.length} assignments for user ${req.user.role}`);
    
    // ====== ЕГЕР АССАЙНМЕНТТЕР ЖОҚ БОЛСА, СТУДЕНТКЕ ТЕСТ ДЕРЕКТЕР КҰРУ ======
    if (assignments.length === 0 && req.user.role === 'student') {
      console.log('📌 No assignments found for student, creating test data...');
      
      // 1. Студенттің тіркелген курстарын табу немесе тест курсын құру
      let testCourse = await Course.findOne();
      
      if (!testCourse) {
        // Тест курсын құру
        testCourse = new Course({
          title: 'Test Course - Introduction to Programming',
          courseCode: 'TEST101',
          description: 'This is a test course for demonstration purposes.',
          instructor: req.user._id,
          credits: 3,
          isActive: true
        });
        await testCourse.save();
        console.log('✅ Created test course');
      }
      
      // 2. Студентті курска тіркеу (егер тіркелмеген болса)
      const existingEnrollment = await Enrollment.findOne({
        student: req.user._id,
        course: testCourse._id
      });
      
      if (!existingEnrollment) {
        const newEnrollment = new Enrollment({
          student: req.user._id,
          course: testCourse._id,
          status: 'enrolled',
          enrolledAt: new Date()
        });
        await newEnrollment.save();
        console.log('✅ Enrolled student in test course');
      }
      
      // 3. Тест ассайнмент құру
      const testAssignment = new Assignment({
        title: 'Welcome Assignment - Getting Started',
        description: 'This is a test assignment to help you get familiar with the platform. Please complete this assignment to understand how the system works.',
        course: testCourse._id,
        instructor: testCourse.instructor || req.user._id,
        type: 'homework',
        totalPoints: 100,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 күннен кейін
        isPublished: true,
        allowLateSubmission: true,
        latePenalty: 10,
        createdAt: new Date()
      });
      
      await testAssignment.save();
      console.log('✅ Created test assignment');
      
      // 4. Жаңа сақталған ассайнменттерді қайта алу
      assignments = await Assignment.find({
        course: testCourse._id,
        isPublished: true
      })
      .populate('course', 'title courseCode')
      .populate('instructor', 'firstName lastName')
      .sort({ dueDate: 1 });
    }
    
    res.json(assignments);
    
  } catch (error) {
    console.error('❌ Get assignments error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching assignments',
      error: error.message 
    });
  }
});

// ====== СТУДЕНТТЕРГЕ АРНАЛҒАН АРНАЙЫ ENDPOINT (isPublished шартысыз) ======
// @route   GET /api/assignments/student/all
// @desc    Get all assignments for student (including unpublished for testing)
// @access  Private (Student only)
router.get('/student/all', auth, authorize('student'), async (req, res) => {
  try {
    console.log(`📌 GET /api/assignments/student/all called by student: ${req.user._id}`);
    
    // Студенттің тіркелген курсқарын табу
    const enrollments = await Enrollment.find({ 
      student: req.user._id,
      status: { $in: ['enrolled', 'active'] }
    }).populate('course');
    
    const courseIds = enrollments
      .map(enrollment => enrollment.course?._id)
      .filter(id => id);
    
    // Барлық ассайнменттерді табу (isPublished-ке қарамастан)
    const assignments = courseIds.length > 0 
      ? await Assignment.find({
          course: { $in: courseIds }
        })
        .populate('course', 'title courseCode')
        .populate('instructor', 'firstName lastName')
        .sort({ dueDate: 1 })
      : [];
    
    console.log(`📌 Found ${assignments.length} assignments (all) for student`);
    
    res.json(assignments);
    
  } catch (error) {
    console.error('❌ Get student assignments error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching student assignments',
      error: error.message 
    });
  }
});

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private (Instructor only)
router.post('/', [
  auth,
  authorize('instructor', 'admin'),
  checkApproval,
  body('title').trim().notEmpty().withMessage('Assignment title is required'),
  body('description').trim().notEmpty().withMessage('Assignment description is required'),
  body('courseId').notEmpty().withMessage('Course ID is required'),
  body('type').isIn(['homework', 'quiz', 'exam', 'project', 'presentation']).withMessage('Invalid assignment type'),
  body('totalPoints').isInt({ min: 1 }).withMessage('Total points must be at least 1'),
  body('dueDate').isISO8601().withMessage('Valid due date is required').custom((value) => {
    const dueDate = new Date(value);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid date format');
    }
    const now = new Date();
    if (dueDate <= now) {
      throw new Error('Due date must be in the future');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { title, description, courseId, type, totalPoints, dueDate, isPublished, allowLateSubmission, latePenalty } = req.body;

    // Verify course exists and instructor owns it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'instructor' || course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create assignments for this course' });
    }

    // Ensure dueDate is properly formatted and valid
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ message: 'Invalid due date format' });
    }

    console.log('Creating assignment with due date:', parsedDueDate.toISOString());

    const assignment = new Assignment({
      title,
      description,
      course: courseId,
      instructor: req.user._id,
      type,
      totalPoints,
      dueDate: parsedDueDate,
      isPublished: isPublished !== undefined ? isPublished : true, // Әдепкі жарияланған
      allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission : true,
      latePenalty: latePenalty || 0,
      createdAt: new Date()
    });

    await assignment.save();

    await assignment.populate([
      { path: 'course', select: 'title courseCode' },
      { path: 'instructor', select: 'firstName lastName' }
    ]);

    // If assignment is published, notify enrolled students
    if (assignment.isPublished) {
      const enrolledStudents = await Enrollment.find({
        course: courseId,
        status: 'enrolled'
      }).populate('student');

      // Create notifications for all enrolled students
      const notificationPromises = enrolledStudents.map(enrollment => 
        Notification.createNotification({
          recipient: enrollment.student._id,
          title: 'New Assignment Available',
          message: `A new assignment "${title}" has been posted in ${course.title}. Due: ${parsedDueDate.toLocaleDateString()}`,
          type: 'assignment',
          targetId: assignment._id,
          targetUrl: `/assignments/${assignment._id}`,
          actionRequired: true
        })
      );

      await Promise.all(notificationPromises);
      console.log(`📢 Sent notifications to ${enrolledStudents.length} students`);
    }

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating assignment',
      error: error.message 
    });
  }
});

// @route   GET /api/assignments/course/:courseId
// @desc    Get assignments for a course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    console.log(`📌 GET /api/assignments/course/${req.params.courseId}`);
    
    // Курстың бар екенін тексеру
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Рөлге қарай ассайнменттерді алу
    let query = { course: req.params.courseId };
    
    if (req.user.role === 'student') {
      // Студент үшін тек жарияланған ассайнменттер
      query.isPublished = true;
    } else if (req.user.role === 'instructor') {
      // Инструктор тек өз курстарын тексеру
      if (course.instructor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: 'Not authorized to view assignments for this course' 
        });
      }
    }
    // Админ үшін шектеу жоқ

    const assignments = await Assignment.find(query)
      .populate('instructor', 'firstName lastName')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching assignments' 
    });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get single assignment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`📌 GET /api/assignments/${req.params.id}`);
    
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title courseCode')
      .populate('instructor', 'firstName lastName');

    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Рөлге қарай тексеру
    if (req.user.role === 'student' && !assignment.isPublished) {
      return res.status(403).json({ 
        success: false,
        message: 'This assignment is not available' 
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching assignment' 
    });
  }
});

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Instructor only)
router.put('/:id', [
  auth,
  authorize('instructor', 'admin'),
  checkApproval
], async (req, res) => {
  try {
    console.log(`📌 PUT /api/assignments/${req.params.id}`);
    
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check if instructor owns this assignment
    if (req.user.role !== 'admin' && assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'course', select: 'title courseCode' },
      { path: 'instructor', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating assignment' 
    });
  }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Instructor only)
router.delete('/:id', [
  auth,
  authorize('instructor', 'admin'),
  checkApproval
], async (req, res) => {
  try {
    console.log(`📌 DELETE /api/assignments/${req.params.id}`);
    
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check if instructor owns this assignment
    if (req.user.role !== 'admin' && assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true,
      message: 'Assignment deleted successfully' 
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting assignment' 
    });
  }
});

// ====== ҚОСЫМША: АССАЙНМЕНТТЕРДІ САҢДЫРУ ҮШІН ENDPOINT ======
// @route   POST /api/assignments/seed
// @desc    Seed test assignments (for development only)
// @access  Private (Admin only)
router.post('/seed', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('🌱 Seeding test assignments...');
    
    // Барлық курстарды алу
    const courses = await Course.find().limit(3);
    
    if (courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No courses found. Please create courses first.'
      });
    }
    
    const testAssignments = [
      {
        title: 'Introduction to Programming Assignment',
        description: 'Write a simple "Hello World" program in any programming language.',
        type: 'homework',
        totalPoints: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 күннен кейін
      },
      {
        title: 'Web Development Quiz',
        description: 'Quiz on HTML, CSS, and JavaScript basics.',
        type: 'quiz',
        totalPoints: 50,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 күннен кейін
      },
      {
        title: 'Final Project Proposal',
        description: 'Submit your final project proposal with detailed specifications.',
        type: 'project',
        totalPoints: 150,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 күннен кейін
      }
    ];
    
    const createdAssignments = [];
    
    for (const course of courses) {
      for (const assignmentData of testAssignments) {
        const assignment = new Assignment({
          ...assignmentData,
          course: course._id,
          instructor: course.instructor,
          isPublished: true,
          allowLateSubmission: true,
          latePenalty: 10,
          createdAt: new Date()
        });
        
        await assignment.save();
        createdAssignments.push(assignment);
      }
    }
    
    console.log(`✅ Created ${createdAssignments.length} test assignments`);
    
    res.json({
      success: true,
      message: `Created ${createdAssignments.length} test assignments`,
      count: createdAssignments.length
    });
    
  } catch (error) {
    console.error('Seed assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding assignments',
      error: error.message
    });
  }
});

module.exports = router;
