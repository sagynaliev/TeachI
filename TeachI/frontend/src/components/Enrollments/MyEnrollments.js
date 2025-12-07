import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  BookOpenIcon,
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../Common/LoadingSpinner';

const MyEnrollments = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/enrollments/student/${user._id}`);
      
      // ====== API RESPONSE ҚҰРЫЛЫМЫН ТЕКСЕРУ ЖӘНЕ ТАЗАРТУ ======
      console.log('API Response:', response.data);
      
      let enrollmentsData = [];
      
      // Әр түрлі response құрылымдары
      if (Array.isArray(response.data)) {
        enrollmentsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        enrollmentsData = response.data.data;
      } else if (response.data?.enrollments && Array.isArray(response.data.enrollments)) {
        enrollmentsData = response.data.enrollments;
      }
      
      // Null/undefined элементтерді алып тастау және course объектісін тексеру
      const cleanEnrollments = enrollmentsData
        .filter(enrollment => enrollment && enrollment._id)
        .map(enrollment => ({
          ...enrollment,
          // Егер course null болса, default объект құру
          course: enrollment.course || {
            _id: 'unknown',
            title: 'Unknown Course',
            courseCode: 'N/A',
            credits: 0,
            description: 'No description available',
            instructor: { firstName: 'Unknown', lastName: 'Instructor' }
          },
          // Егер attendance null болса
          attendance: enrollment.attendance || {
            attendancePercentage: 0,
            totalClasses: 0,
            attendedClasses: 0
          },
          // Егер finalGrade null болса
          finalGrade: enrollment.finalGrade || {
            letterGrade: 'N/A',
            percentage: 0
          }
        }));
      
      setEnrollments(cleanEnrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]); // Қате кезінде бос массив
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enrolled':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (finalGrade) => {
    if (!finalGrade?.percentage) return 'text-gray-600';
    const percentage = finalGrade.percentage;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ====== SAFE ENROLLMENTS - NULL CHECK ======
  const safeEnrollments = enrollments.filter(
    enrollment => enrollment && enrollment.course && enrollment.course._id
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="mt-2 text-gray-600">
          Track your enrolled courses and academic progress
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{safeEnrollments.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {safeEnrollments.filter(e => e.status === 'enrolled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {safeEnrollments.filter(e => e.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {safeEnrollments.length > 0 
                  ? Math.round(safeEnrollments.reduce((sum, e) => sum + (e.attendance?.attendancePercentage || 0), 0) / safeEnrollments.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Course List */}
      {safeEnrollments.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
          <p className="text-gray-600 mb-4">Start learning by enrolling in your first course</p>
          <Link to="/courses" className="btn btn-primary">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {safeEnrollments.map((enrollment) => (
            <div key={enrollment._id} className="card hover:shadow-md transition-shadow">
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                  {enrollment.status?.charAt(0).toUpperCase() + enrollment.status?.slice(1) || 'Unknown'}
                </span>
                {/* ====== CREDITS CHECK ====== */}
                <span className="text-sm text-gray-500">
                  {enrollment.course?.credits || 0} credits
                </span>
              </div>

              {/* Course Info */}
              <div className="mb-4">
                {/* ====== TITLE CHECK ====== */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {enrollment.course?.title || 'Unknown Course'}
                </h3>
                {/* ====== COURSE CODE CHECK ====== */}
                <p className="text-sm text-gray-600 mb-2">
                  {enrollment.course?.courseCode || 'N/A'}
                </p>
                
                {/* ====== INSTRUCTOR CHECK ====== */}
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {enrollment.course?.instructor?.firstName || 'Unknown'} {enrollment.course?.instructor?.lastName || 'Instructor'}
                </div>
              </div>

              {/* Progress Metrics */}
              <div className="space-y-3 mb-4">
                {/* Attendance */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Attendance</span>
                    {/* ====== ATTENDANCE CHECK ====== */}
                    <span className="font-medium">
                      {enrollment.attendance?.attendancePercentage?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${enrollment.attendance?.attendancePercentage || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Grade */}
                {/* ====== FINAL GRADE CHECK ====== */}
                {enrollment.finalGrade?.percentage !== undefined && enrollment.finalGrade?.percentage !== 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Current Grade</span>
                      <span className={`font-medium ${getGradeColor(enrollment.finalGrade)}`}>
                        {enrollment.finalGrade.letterGrade || 'N/A'} ({enrollment.finalGrade.percentage || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (enrollment.finalGrade.percentage || 0) >= 90 ? 'bg-green-500' :
                          (enrollment.finalGrade.percentage || 0) >= 80 ? 'bg-blue-500' :
                          (enrollment.finalGrade.percentage || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${enrollment.finalGrade.percentage || 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {/* ====== COURSE ID CHECK ====== */}
                {enrollment.course?._id && enrollment.course._id !== 'unknown' ? (
                  <Link
                    to={`/courses/${enrollment.course._id}`}
                    className="flex-1 btn btn-secondary text-center"
                  >
                    View Course
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex-1 btn btn-secondary text-center opacity-50 cursor-not-allowed"
                  >
                    View Course
                  </button>
                )}
                
                {enrollment.course?._id && enrollment.course._id !== 'unknown' ? (
                  <Link
                    to={`/assignments?course=${enrollment.course._id}`}
                    className="flex-1 btn btn-primary text-center"
                  >
                    Assignments
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex-1 btn btn-primary text-center opacity-50 cursor-not-allowed"
                  >
                    Assignments
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEnrollments;
