import { lazy, Suspense, useEffect  } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { Box, Spinner, Center } from '@chakra-ui/react'
import { Provider } from "@/components/ui/provider";
import Login from '@/pages/Login';
import Register from '@/pages/Register';

import Admin from '@/pages/Admin';
import AdminLayout from "./AdminLayout";
import UserManagement from "@/components/admin/User/UserManagement";
import UserForm from "@/components/admin/User/UserForm";
import VideoManagement from "@/components/admin/Video/VideoManagement";

import UserLayout from "@/layouts/UserLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Profile from "@/components/user/Profile";



import { useAtom } from "jotai";
import { 
  accessTokenAtom,
  userAtom,
  loadingAtom,
  decodeToken,
 } from "@/atoms/authAtom";


const VideoGenerate = lazy(() => import("@/pages/VideoGenerate"));
const LoadingFallback = () => (
  <Center h="100vh">
    <Spinner size="xl" color="blue.500" />
  </Center>
);



const AppRoutes = (accessToken) => {
  const [user] = useAtom(userAtom);
  const [loading] = useAtom(loadingAtom);
  if(loading) return <LoadingFallback />;

  const redirectPath = () => {
    if (!accessToken || !user) return "/login";

    const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles].filter(Boolean);
    // Chưa hoạt động đúng cách
    if (roles.includes("admin")) return "/admin";
    return "/video/create";
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>

        <Route path="/" element={ <Navigate to={redirectPath()} replace/> } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Page admin */}
        <Route  path="/admin" element={
           <ProtectedRoute requiredRole='admin'>
              <AdminLayout/>
           </ProtectedRoute>
        }>
          
          <Route index element={<Admin/>}></Route>
          <Route path="users" element={<UserManagement/>}></Route>
          <Route path="users/add" element={<UserForm/>}></Route>
          <Route path="users/edit/:id" element={<UserForm/>}></Route>
          <Route path="videos" element={<VideoManagement/>}></Route>
        </Route>


        {/* Page User */}
        <Route path="/video" element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }>
          <Route path="create" element={<VideoGenerate/>}/>
        </Route>

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
          }
        />


      </Routes>
    </Suspense>
  )
}

const Default = () => {
  const [accessToken] = useAtom(accessTokenAtom);
  const [, setUser] = useAtom(userAtom);
  const [, setLoading] = useAtom(loadingAtom);

  useEffect(() => {
    setLoading(true);
    if (accessToken) {
      try {
        const decodedToken = decodeToken(accessToken);
        if (decodedToken?.id) {
          setUser({
            token: accessToken,
            id: decodedToken.id,
            roles: Array.isArray(decodedToken?.role) ? decodedToken.role : decodedToken?.role || [],
          });
        } else {
          throw new Error("Invalid token payload");
        }
      } catch (error) {
        console.error("Token decoding failed:", error.message);
        setUser(null);
        // Có thể thêm logic để xóa accessToken khỏi localStorage hoặc atom
        // localStorage.removeItem("accessToken"); // Nếu lưu token trong localStorage
        // setAccessToken(null); // Nếu có setAccessToken
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [accessToken, setUser, setLoading]);
  return (
    <Provider defaultTheme="light">
      <BrowserRouter>
      <Box minH="100vh">
        <AppRoutes accessToken={accessToken} />
      </Box>
      </BrowserRouter>
    </Provider>
  );
};

export default Default;
