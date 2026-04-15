import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            const serverUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:10000';
            const newSocket = io(serverUrl, {
                withCredentials: true,
            });
            
            setSocket(newSocket);

            newSocket.on('connect', () => {
                const role = user.roleAttr || user.role;
                newSocket.emit('join_role_room', role);
                
                if (user.id || user._id) {
                    newSocket.emit('join_user_room', user.id || user._id);
                }
            });

            return () => {
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
