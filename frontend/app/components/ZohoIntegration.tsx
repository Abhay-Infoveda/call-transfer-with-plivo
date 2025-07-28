'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ZohoStatus {
  connected: boolean;
  message: string;
}

const ZohoIntegration: React.FC = () => {
  const { token } = useAuth();
  const [zohoStatus, setZohoStatus] = useState<ZohoStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      checkZohoStatus();
    }
  }, [token]);

  const checkZohoStatus = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/zoho/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setZohoStatus(data);
    } catch (error) {
      console.error('Error checking Zoho status:', error);
    }
  };

  const connectZoho = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/zoho/connect', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Received authUrl from backend:', data.authUrl);
      
      if (data.success) {
        // Redirect to Zoho OAuth URL
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to connect Zoho');
      }
    } catch (error) {
      setError('Failed to connect Zoho CRM');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectZoho = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/zoho/disconnect', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setZohoStatus({ connected: false, message: 'Zoho CRM disconnected' });
      } else {
        setError(data.error || 'Failed to disconnect Zoho');
      }
    } catch (error) {
      setError('Failed to disconnect Zoho CRM');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Zoho CRM Integration</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Status</h3>
        {zohoStatus ? (
          <div className={`p-3 rounded ${
            zohoStatus.connected 
              ? 'bg-green-100 text-green-800 border border-green-400' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-400'
          }`}>
            {zohoStatus.message}
          </div>
        ) : (
          <div className="bg-gray-100 text-gray-800 p-3 rounded border border-gray-400">
            Checking connection status...
          </div>
        )}
      </div>

      <div className="space-y-4">
        {zohoStatus?.connected ? (
          <button
            onClick={disconnectZoho}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded"
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect Zoho CRM'}
          </button>
        ) : (
          <button
            onClick={connectZoho}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
          >
            {isLoading ? 'Connecting...' : 'Connect Zoho CRM'}
          </button>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold mb-2">What you can do with Zoho CRM:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>Create contacts from voice calls</li>
          <li>Generate leads from call data</li>
          <li>Create deals and opportunities</li>
          <li>Search existing contacts</li>
          <li>Update contact information</li>
          <li>Track call outcomes in CRM</li>
        </ul>
      </div>
    </div>
  );
};

export default ZohoIntegration; 