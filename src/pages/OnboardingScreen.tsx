import { useNavigate } from 'react-router-dom';
import Onboarding from '@/components/Onboarding';

const OnboardingScreen = () => {
  const navigate = useNavigate();

  const handleOnboardingComplete = () => {
    navigate('/', { replace: true });
  };

  return <Onboarding onComplete={handleOnboardingComplete} />;
};

export default OnboardingScreen; 