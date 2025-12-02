import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Workout from './pages/Workout'
import Progress from './pages/Progress'
import AdminExercises from './pages/AdminExercises'
import Profile from './pages/Profile'
import ProfileEdit from './pages/ProfileEdit'
import Settings from './pages/Settings'
import Community from './pages/Community'
import { supabase } from './lib/supabaseClient'

function RequireAuth({ children }){
  const user = supabase.auth.getUser ? null : null // placeholder; we'll rely on simple redirects in pages
  return children
}

export default function App(){
  return (
    <div className="app-full">
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/" element={<Home/>} />
        <Route path="/workout" element={<Workout/>} />
        <Route path="/progress" element={<Progress/>} />
        <Route path="/admin/exercises" element={<AdminExercises/>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/profile/edit" element={<ProfileEdit/>} />
        <Route path="/settings" element={<Settings/>} />
        <Route path="/community" element={<Community/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
