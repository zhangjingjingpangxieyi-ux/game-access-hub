import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectList from './pages/ProjectList'
import NewProject from './pages/NewProject'
import ProjectDetail from './pages/ProjectDetail'
import EditProject from './pages/EditProject'
import Admin from './pages/Admin'
import DocCenter from './pages/DocCenter'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/new" element={<NewProject />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/project/:id/edit" element={<EditProject />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/docs" element={<DocCenter />} />
      </Routes>
    </Layout>
  )
}
