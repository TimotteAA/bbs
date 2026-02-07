import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Spin, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/router';

export const Route = createFileRoute('/auth/callback/github')({
  component: GitHubCallback,
});

function GitHubCallback() {
  const navigate = useNavigate();
  const githubCallbackMutation = useMutation(trpc.auth.githubCallback.mutationOptions());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      message.error('GitHub 授权参数缺失');
      navigate({ to: '/auth' });
      return;
    }

    githubCallbackMutation.mutate(
      { code, state },
      {
        onSuccess: (result) => {
          if (result.success) {
            message.success('GitHub 登录成功！');
            navigate({ to: '/' });
          } else {
            message.error(result.errorDetail || 'GitHub 登录失败');
            navigate({ to: '/auth' });
          }
        },
        onError: (error: any) => {
          message.error(error.message || 'GitHub 登录失败');
          navigate({ to: '/auth' });
        },
      }
    );
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: 16,
    }}>
      <Spin size="large" />
      <span>正在处理 GitHub 登录...</span>
    </div>
  );
}
