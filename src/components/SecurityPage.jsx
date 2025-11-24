// 보안 및 개인정보 보호 페이지
import styled from 'styled-components';
import { Shield, Lock, Eye, EyeOff, Download, Trash2, Key, CheckCircle, AlertTriangle } from 'lucide-react';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #ffffff;
`;

const Hero = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const HeroIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(74, 144, 226, 0.4);
`;

const HeroTitle = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const HeroDescription = styled.p`
  font-size: 18px;
  color: #888;
  line-height: 1.6;
`;

const Section = styled.div`
  margin-bottom: 60px;
`;

const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(74, 144, 226, 0.3);
    transform: translateY(-4px);
  }
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$color || 'rgba(74, 144, 226, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: ${props => props.$iconColor || '#4a90e2'};
`;

const FeatureTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const FeatureDescription = styled.p`
  font-size: 14px;
  color: #888;
  line-height: 1.6;
`;

const SecurityBadge = styled.div`
  background: linear-gradient(135deg, rgba(46, 213, 115, 0.1), rgba(56, 249, 215, 0.1));
  border: 1px solid rgba(46, 213, 115, 0.3);
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const BadgeIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2ed573, #38f9d7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
`;

const BadgeText = styled.div`
  flex: 1;
`;

const BadgeTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #2ed573;
  margin-bottom: 4px;
`;

const BadgeDescription = styled.div`
  font-size: 13px;
  color: #888;
`;

const PolicyList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const PolicyItem = styled.li`
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const PolicyIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(74, 144, 226, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a90e2;
  flex-shrink: 0;
  margin-top: 2px;
`;

const PolicyContent = styled.div`
  flex: 1;
`;

const PolicyTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const PolicyDescription = styled.div`
  font-size: 13px;
  color: #888;
  line-height: 1.5;
`;

const CTASection = styled.div`
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(53, 122, 189, 0.1));
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
`;

const CTATitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const CTADescription = styled.p`
  font-size: 16px;
  color: #888;
  margin-bottom: 24px;
`;

const CTAButton = styled.button`
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border: none;
  color: #ffffff;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
  }
`;

const SecurityPage = () => {
  return (
    <Container>
      <Hero>
        <HeroIcon>
          <Shield size={40} />
        </HeroIcon>
        <HeroTitle>보안 & 개인정보 보호</HeroTitle>
        <HeroDescription>
          MindFlow는 사용자의 개인정보를 최우선으로 보호합니다.<br />
          모든 메시지는 엔드투엔드 암호화되며, 우리는 내용을 볼 수 없습니다.
        </HeroDescription>
      </Hero>

      {/* 인증 배지 */}
      <SecurityBadge>
        <BadgeIcon>
          <CheckCircle size={24} />
        </BadgeIcon>
        <BadgeText>
          <BadgeTitle>엔드투엔드 암호화 적용</BadgeTitle>
          <BadgeDescription>
            모든 1:1 대화는 종단간 암호화로 보호됩니다. 서버에서도 메시지 내용을 볼 수 없습니다.
          </BadgeDescription>
        </BadgeText>
      </SecurityBadge>

      {/* 보안 기능 */}
      <Section>
        <SectionTitle>
          <Lock size={28} />
          핵심 보안 기능
        </SectionTitle>
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon $color="rgba(74, 144, 226, 0.2)" $iconColor="#4a90e2">
              <Lock size={24} />
            </FeatureIcon>
            <FeatureTitle>엔드투엔드 암호화</FeatureTitle>
            <FeatureDescription>
              RSA-2048 + AES-256 하이브리드 암호화로 메시지를 보호합니다.
              암호화 키는 사용자 기기에만 저장됩니다.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="rgba(46, 213, 115, 0.2)" $iconColor="#2ed573">
              <Eye size={24} />
            </FeatureIcon>
            <FeatureTitle>Zero-Knowledge</FeatureTitle>
            <FeatureDescription>
              서버는 암호화된 데이터만 전달합니다.
              관리자를 포함한 누구도 메시지 내용을 볼 수 없습니다.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="rgba(255, 193, 7, 0.2)" $iconColor="#ffc107">
              <Shield size={24} />
            </FeatureIcon>
            <FeatureTitle>본인인증</FeatureTitle>
            <FeatureDescription>
              공인 인증기관을 통한 본인인증으로
              악의적인 사용자를 사전에 차단합니다.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="rgba(156, 39, 176, 0.2)" $iconColor="#9c27b0">
              <Key size={24} />
            </FeatureIcon>
            <FeatureTitle>2단계 인증</FeatureTitle>
            <FeatureDescription>
              TOTP 기반 2FA로 계정을 이중으로 보호합니다.
              새 기기 로그인 시 이메일 알림을 전송합니다.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="rgba(255, 107, 107, 0.2)" $iconColor="#ff6b6b">
              <Trash2 size={24} />
            </FeatureIcon>
            <FeatureTitle>자동 삭제</FeatureTitle>
            <FeatureDescription>
              1일/7일/30일 후 자동으로 메시지를 삭제할 수 있습니다.
              완전 삭제 시 복구가 불가능합니다.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon $color="rgba(0, 188, 212, 0.2)" $iconColor="#00bcd4">
              <Download size={24} />
            </FeatureIcon>
            <FeatureTitle>데이터 내보내기</FeatureTitle>
            <FeatureDescription>
              언제든지 모든 데이터를 JSON 형식으로 다운로드할 수 있습니다.
              데이터는 100% 사용자 소유입니다.
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>
      </Section>

      {/* 우리가 하지 않는 것 */}
      <Section>
        <SectionTitle>
          <EyeOff size={28} />
          우리가 하지 않는 것
        </SectionTitle>
        <PolicyList>
          <PolicyItem>
            <PolicyIcon>
              <AlertTriangle size={14} />
            </PolicyIcon>
            <PolicyContent>
              <PolicyTitle>사용자 데이터 판매</PolicyTitle>
              <PolicyDescription>
                절대로 사용자 데이터를 제3자에게 판매하지 않습니다.
                우리의 수익 모델은 광고가 아닌 프리미엄 서비스입니다.
              </PolicyDescription>
            </PolicyContent>
          </PolicyItem>

          <PolicyItem>
            <PolicyIcon>
              <AlertTriangle size={14} />
            </PolicyIcon>
            <PolicyContent>
              <PolicyTitle>메시지 스캐닝</PolicyTitle>
              <PolicyDescription>
                메시지 내용을 스캔하거나 분석하지 않습니다.
                엔드투엔드 암호화로 인해 기술적으로도 불가능합니다.
              </PolicyDescription>
            </PolicyContent>
          </PolicyItem>

          <PolicyItem>
            <PolicyIcon>
              <AlertTriangle size={14} />
            </PolicyIcon>
            <PolicyContent>
              <PolicyTitle>광고 타겟팅</PolicyTitle>
              <PolicyDescription>
                사용자 프로파일을 만들어 맞춤 광고를 제공하지 않습니다.
                Google Analytics도 사용하지 않습니다.
              </PolicyDescription>
            </PolicyContent>
          </PolicyItem>

          <PolicyItem>
            <PolicyIcon>
              <AlertTriangle size={14} />
            </PolicyIcon>
            <PolicyContent>
              <PolicyTitle>백도어</PolicyTitle>
              <PolicyDescription>
                정부 기관을 위한 백도어나 마스터 키를 만들지 않습니다.
                법적 요청이 있어도 기술적으로 메시지를 복호화할 수 없습니다.
              </PolicyDescription>
            </PolicyContent>
          </PolicyItem>
        </PolicyList>
      </Section>

      {/* CTA */}
      <CTASection>
        <CTATitle>자세한 내용이 궁금하신가요?</CTATitle>
        <CTADescription>
          전체 개인정보 처리방침과 보안 정책을 확인하세요
        </CTADescription>
        <CTAButton onClick={() => window.open('/PRIVACY_POLICY.md', '_blank')}>
          개인정보 처리방침 보기
        </CTAButton>
      </CTASection>
    </Container>
  );
};

export default SecurityPage;
