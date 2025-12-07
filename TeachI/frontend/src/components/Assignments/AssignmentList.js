import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatDateTime, getTimeUntilDate, isValidDate } from '../../utils/dateUtils';

const AssignmentList = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchAssignments();
    if (user?.role === 'student') {
      fetchEnrolledCourses();
    } else {
      fetchInstructorCourses();
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedCourse, selectedStatus]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      let url = '/api/assignments';
      
      if (selectedCourse) {
        url = `/api/assignments/course/${selectedCourse}`;
      }

      const response = await axios.get(url);
      
      // ====== ТҮЗЕТУ БОЛЫП ТАБЫЛАДЫ ======
      // API response құрылымын тексеру
      console.log('API Response:', response.data);
      
      // Әр түрлі response құрылымдары үшін
      let assignmentsData = [];
      
      if (Array.isArray(response.data)) {
        // Егер response тікелей массив болса
        assignmentsData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Егер response объект болса және data массиві бар болса
        assignmentsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.assignments)) {
        // Егер response объект болса және assignments массиві бар болса
        assignmentsData = response.data.assignments;
      } else if (response.data && typeof response.data === 'object') {
        // Егер бір объект болса, оны массивке айналдыру
        assignmentsData = [response.data];
      }
      
      // Null/undefined элементтерді тазарту
      const cleanAssignments = assignmentsData.filter(
        assignment => assignment && assignment._id && typeof assignment === 'object'
      );
      
      setAssignments(cleanAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]); // Қате кезінде бос массив қою
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await axios.get(`/api/enrollments/student/${user._id}`);
      // Response құрылымын тексеру
      const coursesData = response.data?.data || response.data || [];
      const cleanCourses = Array.isArray(coursesData) 
        ? coursesData.map(enrollment => enrollment.course).filter(course => course && course._id)
        : [];
      setCourses(cleanCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchInstructorCourses = async () => {
    try {
      const response = await axios.get(`/api/courses/instructor/${user._id}`);
      // Response құрылымын тексеру
      const coursesData = response.data?.data || response.data || [];
      const cleanCourses = Array.isArray(coursesData) 
        ? coursesData.filter(course => course && course._id)
        : [];
      setCourses(cleanCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    
    if (!isValidDate(dueDate)) return 'Invalid date';
    
    return formatDateTime(dueDate);
  };

  const getDaysUntilDue = (dueDate) => {
    return getTimeUntilDate(dueDate);
  };

  const getStatusIcon = (assignment) => {
    if (!assignment.dueDate) return <ClockIcon className="h-5 w-5 text-gray-500" />;
    
    const dueDate = new Date(assignment.dueDate);
    if (isNaN(dueDate.getTime())) return <ClockIcon className="h-5 w-5 text-gray-500" />;
    
    const now = new Date();
    
    if (assignment.isSubmitted) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (dueDate < now) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    } else {
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (assignment) => {
    if (!assignment.dueDate) return 'No Due Date';
    
    const dueDate = new Date(assignment.dueDate);
    if (isNaN(dueDate.getTime())) return 'Invalid Date';
    
    const now = new Date();
    
    if (assignment.isSubmitted) {
      return 'Submitted';
    } else if (dueDate < now) {
      return 'Overdue';
    } else {
      return 'Pending';
    }
  };

  const getStatusColor = (assignment) => {
    if (!assignment.dueDate) return 'text-gray-600';
    
    const dueDate = new Date(assignment.dueDate);
    if (isNaN(dueDate.getTime())) return 'text-gray-600';
    
    const now = new Date();
    
    if (assignment.isSubmitted) {
      return 'text-green-600';
    } else if (dueDate < now) {
      return 'text-red-600';
    } else {
      return 'text-yellow-600';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // ====== Қосымша қорғаныс ======
  // Map-тен бұрын assignments массивін тексеру
  const safeAssignments = Array.isArray(assignments) 
    ? assignments.filter(assignment => assignment && assignment._id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="mt-2 text-gray-600">
            {user?.role === 'student' 
              ? 'View and submit your assignments'
              : 'Manage course assignments and submissions'
            }
          </p>
        </div>
        
        {user?.role === 'instructor' && ( // Removed admin from create assignment button
          <Link
            to="/create-assignment"
            className="mt-4 sm:mt-0 btn btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Assignment
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="input"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course?._id || Math.random()} value={course?._id}>
                  {course?.title || 'Unknown Course'} ({course?.courseCode || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {user?.role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedCourse('');
                setSelectedStatus('');
              }}
              className="btn btn-secondary flex items-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Assignment List */}
      {safeAssignments.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600">
            {user?.role === 'student' 
              ? 'No assignments available for your enrolled courses'
              : 'Create your first assignment to get started'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeAssignments.map((assignment) => (
            <div key={assignment._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(assignment)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {assignment?.title || 'No Title'}
                    </h3>
                    <span className={`text-sm font-medium ${getStatusColor(assignment)}`}>
                      {getStatusText(assignment)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {assignment?.description || 'No description provided'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Course:</span> {assignment.course?.title || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {assignment?.type || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Points:</span> {assignment?.totalPoints || 0}
                    </div>
                    <div>
                      <span className="font-medium">Due:</span> {formatDueDate(assignment?.dueDate)}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={getStatusColor(assignment)}>
                        {getDaysUntilDue(assignment?.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <Link
                    to={`/assignments/${assignment._id}`}
                    className="btn btn-primary text-center"
                  >
                    View Details
                  </Link>
                  
                  {user?.role === 'instructor' && assignment.instructor === user._id && (
                    <Link
                      to={`/assignments/${assignment._id}/submissions`}
                      className="btn btn-secondary"
                    >
                      View Submissions
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
