import { User, Mail, BookOpen, Layout, Upload, Phone, Building, GraduationCap, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import {doc, setDoc, addDoc, getDoc, query, collection, where, getDocs , updateDoc, increment} from 'firebase/firestore';
import { db } from '../components/firebase';
import axios from "axios";

type UserProfile = {
  name: string;
  studentId: string;
  email: string;
  phone: string;
  department: string;
  batch: string;
  level: string;
  term: string;
  section: string;
  thesis?: Thesis[];
  projects?: Project[];
};

type Thesis = {
  title: string;
  supervisor: string;
  status: string;
};

type Project = {
  title: string;
  courseName: string;
  status: string;
};

export function Profile() {
  const [showThesisForm, setShowThesisForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [file, setfile] = useState<File | null>(null);
  const [uploadLink, setUploadLink] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [publishingYear, setPublishingYear] = useState('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ThesisID, setThesisID] = useState('');
  const [projectID, setProjectID] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseTeacher, setCourseTeacher] = useState('');
  const [publishingYearProject, setPublishingYearProject] = useState('');
  const [topicProject, setTopicProject] = useState('');
  const [keywordsProject, setKeywordsProject] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      setStudentId(studentId);
    }
  }, []);

  const [user, setUser] = useState<UserProfile>({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    department: '',
    batch: '',
    level: '',
    term: '',
    section: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const studentQuery = query(
          collection(db, "StudentInformation"),
          where("studentId", "==", studentId)
        );
        
        const studentQuerySnapshot = await getDocs(studentQuery);
  
        if (!studentQuerySnapshot.empty) {
          const studentDoc = studentQuerySnapshot.docs[0];
          const profileData = studentDoc.data();
          
          // Fetch thesis data
          const thesisCollectionRef = collection(db, "Thesis Paper");
          const thesisQuery = query(thesisCollectionRef, where("studentId", "==", studentId));
          const thesisSnapshot = await getDocs(thesisQuery);
          const thesisData = thesisSnapshot.docs.map(doc => doc.data()) as Thesis[];
          console.log(thesisData);
          // Fetch projects data
          const projectCollectionRef = collection(db, "Projects");
          const projectQuery = query(projectCollectionRef, where("studentId", "==", studentId));
          const projectSnapshot = await getDocs(projectQuery);
          const projectData = projectSnapshot.docs.map(doc => doc.data()) as Project[];

          // Set the user data with thesis and projects
          setUser({
            name: profileData.name,
            studentId: profileData.studentId,
            email: profileData.email,
            phone: profileData.phone,
            department: profileData.department,
            batch: profileData.batch,
            level: profileData.level,
            term: profileData.term,
            section: profileData.section,
            thesis: thesisData,
            projects: projectData
          });
        } else {
          console.log("No student found with the given studentId!");
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchProfile();
    }

  }, [studentId]);

  const handleThesisSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('submitted');
    // Add the functionality you need for the thesis form submission here
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setfile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await axios.post("http://localhost:5000/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.link) {
            console.log(response.data.link); // Set the Google Drive viewable link
            await addDoc(collection(db, "PendingThesisPaper"), {
                ThesisID: ThesisID,
                studentId: studentId,
                title: title,
                author: author,
                supervisor: supervisor,
                publishingYear: publishingYear,
                topic: topic,
                keywords: keywords,
                pdfLink: response.data.link,
                helpful: 0,
                notHelpful: 0,
            });
            console.log('Thesis Submitted')
            setShowThesisForm(false);
        } else {
            console.error("Upload successful, but no link returned:", response.data);
        }
    } catch (error) {
        console.error("Upload failed:", error);
    }
    // try {
    //   const dashboardDocRef = doc(db, 'Dashboard', 'Original'); // Replace 'yourDocumentId' with the actual document ID
    //   await updateDoc(dashboardDocRef, {
    //     'Total Theses': increment(1)
    //   });
    // } catch (error) {
    //   console.error('Error updating total theses:', error);
    // }
};


  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle project submission
    try {
      // const projectDocRef = collection(doc(db, 'PendingProjects'));
      await addDoc(collection(db, "PendingProjects"),{
        projectID: projectID,
        title: projectTitle,
        studentId: studentId,
        teamMembers: teamMembers,
        courseName: courseName,
        courseTeacher: courseTeacher,
        publishingYear: publishingYearProject,
        topic: topicProject,
        keywords: keywordsProject,
        githubLink: githubLink,
        helpful: 0,
        notHelpful: 0,
      });
    } catch (error) {
      console.error('Error submitting project:', error);
    }
    console.log('Project submitted');
    setShowProjectForm(false);
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const studentQuery = query(
        collection(db, "StudentInformation"),
        where("studentId", "==", studentId)
      );
      const studentQuerySnapshot = await getDocs(studentQuery);
  
      if (!studentQuerySnapshot.empty) {
        // If document exists, update it
        const studentDoc = studentQuerySnapshot.docs[0];
        const studentDocRef = doc(db, "StudentInformation", studentDoc.id);
        await updateDoc(studentDocRef, {
          studentId:studentId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          department: user.department,
          batch: user.batch,
          level: user.level,
          term: user.term,
          section: user.section,
        });
        console.log("Profile updated");
      } else {
        // If document does not exist, create a new one with studentId as ID
        const newStudentDocRef = doc(db, "StudentInformation", studentId);
        await setDoc(newStudentDocRef, {
          studentId:studentId, // Include studentId in the document
          name: user.name,
          email: user.email,
          phone: user.phone,
          department: user.department,
          batch: user.batch,
          level: user.level,
          term: user.term,
          section: user.section,
        });
        console.log("New student profile created");
      }
  
      setShowUpdateForm(false);
    } catch (error) {
      console.error("Error updating or creating profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Manage your account and view your academic progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="profile-info bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="profile-name font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">Student ID: {user.studentId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="profile-email font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="profile-phone font-medium">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="profile-department font-medium">{user.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Level: {user.level}, Term: {user.term}</p>
                  <p className="text-sm text-gray-600">Section: {user.section}, Batch: {user.batch}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thesis Information */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Thesis Information</h2>
              <button 
                className="btn btn-primary flex items-center gap-2"
                onClick={() => setShowThesisForm(true)}
              >
                <Upload className="h-4 w-4" />
                Upload Thesis
              </button>
            </div>
            {user.thesis && user.thesis.length > 0 ? (
              user.thesis.map((thesis, index) => (
                <div key={index} className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-0">
                  <BookOpen className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{thesis.title}</p>
                        <p className="text-sm text-gray-600">Supervisor: {thesis.supervisor}</p>
                        {/* <p className="text-sm text-gray-600">Status: {thesis.status}</p> */}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No thesis found.</p>
            )}
          </div>

          {/* Course Projects */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Course Projects</h2>
              <button 
                className="btn btn-primary flex items-center gap-2"
                onClick={() => setShowProjectForm(true)}
              >
                <Upload className="h-4 w-4" />
                Upload Project
              </button>
            </div>
            {user.projects && user.projects.length > 0 ? (
              user.projects.map((project, index) => (
                <div key={index} className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-0">
                  <Layout className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-gray-600">Course: {project.courseName}</p>
                        {/* <p className="text-sm text-gray-600">Status: {project.status}</p> */}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No projects found.</p>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="btn btn-primary w-full" onClick={() => setShowUpdateForm(true)}>Update Profile</button>
              <button className="btn btn-secondary w-full">Change Password</button>
            </div>
          </div>
        </div>
      </div>

      {showUpdateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Update Profile</h3>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="input"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="studentId"
                  className="input"
                  value={user.studentId}
                  onChange={(e) => setUser({ ...user, studentId: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="input"
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  className="input"
                  value={user.department}
                  onChange={(e) => setUser({ ...user, department: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <input
                  type="text"
                  className="input"
                  value={user.batch}
                  onChange={(e) => setUser({ ...user, batch: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <input
                  type="text"
                  className="input"
                  value={user.level}
                  onChange={(e) => setUser({ ...user, level: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <input
                  type="text"
                  className="input"
                  value={user.term}
                  onChange={(e) => setUser({ ...user, term: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  className="input"
                  value={user.section}
                  onChange={(e) => setUser({ ...user, section: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Update Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Thesis Upload Modal */}
        {showThesisForm && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative overflow-y-auto max-h-screen">
        <button
          onClick={() => setShowThesisForm(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Upload Thesis</h3>
        </div>
        <form onSubmit={handleThesisSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ThesisID</label>
            <input type="text" className="input" onChange={(e) => setThesisID(e.target.value)}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" className="input" onChange={(e) => setTitle(e.target.value)}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input type="text" className="input" required onChange={(e)=> setAuthor(e.target.value)}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
            <input type="text" className="input" required onChange={(e)=> setSupervisor(e.target.value)}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publishing Year</label>
            <input type="number" className="input" required min="2000" max="2025" onChange={(e)=> setPublishingYear(e.target.value)}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input type="text" className="input" required onChange={(e)=> setTopic(e.target.value)}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma separated)</label>
            <input
              type="text"
              className="input"
              required
              placeholder="e.g., AI, Machine Learning, Computer Vision"
              onChange={(e)=> setKeywords(e.target.value)}
            />
          </div>
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thesis File</label>
                <input type="file" onChange={handleFileChange} className="input" required accept=".pdf,.doc,.docx" />
              </div>
              <button type="button" onClick={handleUpload} className="btn btn-primary w-full">
            Upload Thesis
          </button>
        </form>
      </div>
    </div>
  )}

      {/* Project Upload Modal */}
      {/* Project Upload Modal */}
      {showProjectForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Upload Project</h3>
        <button
          onClick={() => setShowProjectForm(false)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close form"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleProjectSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-file">
            Project ID
          </label>
          <input
            id="project-id"
            type="text"
            className="input"
            required
            onChange={(e) => setProjectID(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-title">
            Title
          </label>
          <input
            id="project-title"
            type="text"
            className="input"
            required
            onChange={(e)=> setProjectTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="team-members">
            Team Members (comma separated)
          </label>
          <input
            id="team-members"
            type="text"
            className="input"
            required
            onChange={(e)=> setTeamMembers(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="course-name">
            Course Name
          </label>
          <input
            id="course-name"
            type="text"
            className="input"
            required
            onChange={(e)=> setCourseName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="course-teacher">
            Course Teacher
          </label>
          <input
            id="course-teacher"
            type="text"
            className="input"
            required
            onChange={(e)=> setCourseTeacher(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="publishing-year">
            Publishing Year
          </label>
          <input
            id="publishing-year"
            type="number"
            className="input"
            required
            min="2000"
            onChange={(e)=> setPublishingYearProject(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="topic">
            Topic
          </label>
          <input
            id="topic"
            type="text"
            className="input"
            required
            onChange={(e)=> setTopicProject(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="keywords">
            Keywords (comma separated)
          </label>
          <input
            id="keywords"
            type="text"
            className="input"
            required
            placeholder="e.g., Web Development, React, Node.js"
            onChange={(e)=> setKeywordsProject(e.target.value)}
          />
        </div>
        <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Repository Link</label>
                <input type="url" className="input" required placeholder="https://github.com/username/repository" onChange={(e)=> setGithubLink(e.target.value)}/>
              </div>
        <button type="submit" className="btn btn-primary w-full">
          Upload Project
        </button>
      </form>
    </div>
  </div>
)}

    </div>
  );

}
  function setFile(arg0: any) {
    throw new Error('Function not implemented.');
  }

