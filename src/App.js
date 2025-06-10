// src/App.js
import React, { useState } from 'react';
import { 
  Layout, 
  Typography, 
  Row, 
  Col, 
  Card, 
  Divider, 
  Steps, 
  Button, 
  theme,
  Carousel,
  Image
} from 'antd';
import RentalForm from './RentalForm';
import {
  CarOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

function App() {
  const { token } = useToken();
  const [activeTab, setActiveTab] = useState('reservar');
  
  const contentStyle = {
    height: '300px',
    color: token.colorTextLight,
    lineHeight: '300px',
    textAlign: 'center',
    background: token.colorPrimary,
  };

  const features = [
    {
      icon: <CarOutlined style={{ fontSize: '32px' }} />,
      title: 'Amplia variedad',
      description: 'JetSkis, cuatriciclos, equipo de buceo y tablas de surf para todas las edades'
    },
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: '32px' }} />,
      title: 'Seguridad garantizada',
      description: 'Equipos de seguridad incluidos y mantenimiento constante de todos los productos'
    },
    {
      icon: <DollarOutlined style={{ fontSize: '32px' }} />,
      title: 'Precios accesibles',
      description: 'Tarifas competitivas con descuentos por múltiples productos'
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: '32px' }} />,
      title: 'Flexibilidad horaria',
      description: 'Turnos de 30 minutos con posibilidad de reservar hasta 3 turnos consecutivos'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16
          }}>
            <CarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          </div>
          <Title level={3} style={{ color: 'white', marginBottom: 0 }}>
            Parador Caribeño - Alquiler de Equipos
          </Title>
        </div>
        
        <div>
          <Button 
            type={activeTab === 'reservar' ? 'primary' : 'default'} 
            onClick={() => setActiveTab('reservar')}
            style={{ marginRight: 8 }}
          >
            Reservar ahora
          </Button>
          {/* Añadido el botón para Reservas realizadas */}
          <Button 
            type={activeTab === 'myReservations' ? 'primary' : 'default'} 
            onClick={() => setActiveTab('myReservations')}
            style={{ marginRight: 8 }}
          >
            Reservas realizadas
          </Button>
        </div>
      </Header>
      
       <Content style={{ padding: '0 50px', marginTop: 24 }}>
        {activeTab === 'reservar' || activeTab === 'myReservations' ? (
          <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            {/* Título más grande y con mejor espaciado */}
            <Title 
              level={1} 
              style={{ 
                textAlign: 'center', 
                color: token.colorPrimary,
                marginBottom: 16,
                fontSize: '2.5rem'
              }}
            >
              Reserva tus equipos de playa
            </Title>
       <Text 
              style={{ 
                display: 'block', 
                textAlign: 'center', 
                marginBottom: 48, 
                fontSize: '1.2rem',
                fontWeight: 500,
                color: token.colorTextSecondary
              }}
            >
              Alquila los mejores equipos para disfrutar de la playa con total seguridad
            </Text>
      
      <div style={{ 
              background: token.colorBgContainer, 
              borderRadius: 8, 
              padding: 32,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              
              <RentalForm initialActiveTab={activeTab === 'myReservations' ? 'myReservations' : 'reservar'} />
            </div>
          </div>
  ) : (
          <div>
            <Carousel autoplay style={{ marginBottom: 48 }}>
              <div>
                <div style={{ ...contentStyle, background: 'linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%)' }}>
                  <Title level={2} style={{ color: 'white' }}>¡Vive la aventura en el Caribe!</Title>
                  <Paragraph style={{ color: 'white', fontSize: 18 }}>
                    Alquila los mejores equipos para disfrutar del mar
                  </Paragraph>
                </div>
              </div>
              <div>
                <div style={{ ...contentStyle, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                  <Title level={2} style={{ color: 'white' }}>Promoción Especial</Title>
                  <Paragraph style={{ color: 'white', fontSize: 18 }}>
                    10% de descuento al alquilar más de un producto
                  </Paragraph>
                </div>
              </div>
              <div>
                <div style={{ ...contentStyle, background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' }}>
                  <Title level={2} style={{ color: 'white' }}>Seguro de Tormenta</Title>
                  <Paragraph style={{ color: 'white', fontSize: 18 }}>
                    Recupera el 50% si no puedes disfrutar por mal tiempo
                  </Paragraph>
                </div>
              </div>
            </Carousel>
            
            <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
              Por qué elegirnos
            </Title>
            
            <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                  <Card 
                    bordered={false} 
                    style={{ textAlign: 'center', height: '100%' }}
                    hoverable
                  >
                    <div style={{ marginBottom: 16 }}>
                      {feature.icon}
                    </div>
                    <Title level={4} style={{ marginBottom: 8 }}>{feature.title}</Title>
                    <Text>{feature.description}</Text>
                  </Card>
                </Col>
              ))}
            </Row>
            
            <Divider />
            
            <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
              Nuestros Productos
            </Title>
            
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card 
                  title="JetSkis y Cuatriciclos" 
                  bordered={false}
                  style={{ height: '100%' }}
                >
                  <Image
                    src="https://images.unsplash.com/photo-1589839547346-5e7e0d515e7c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    alt="JetSki"
                    preview={false}
                    style={{ borderRadius: 8, marginBottom: 16 }}
                  />
                  <Paragraph>
                    Experimenta la emoción de navegar a toda velocidad con nuestros JetSkis de última generación. 
                    Para tu seguridad, incluyen chalecos salvavidas y cascos.
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Detalles importantes:</Text>
                    <ul>
                      <li>Máximo 2 personas por vehículo</li>
                      <li>Turnos de 30 minutos (hasta 3 turnos consecutivos)</li>
                      <li>Se requiere experiencia mínima para conducir</li>
                    </ul>
                  </Paragraph>
                </Card>
              </Col>
              
              <Col xs={24} md={12}>
                <Card 
                  title="Equipo de Buceo y Tablas de Surf" 
                  bordered={false}
                  style={{ height: '100%' }}
                >
                  <Image
                    src="https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    alt="Buceo"
                    preview={false}
                    style={{ borderRadius: 8, marginBottom: 16 }}
                  />
                  <Paragraph>
                    Explora el mundo submarino con nuestro equipo de buceo profesional o disfruta 
                    de las olas con nuestras tablas de surf para adultos y niños.
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Detalles importantes:</Text>
                    <ul>
                      <li>Tablas de surf en diferentes tamaños</li>
                      <li>Equipo de buceo completo (traje, aletas, máscara, snorkel)</li>
                      <li>Instructores disponibles para clases introductorias</li>
                    </ul>
                  </Paragraph>
                </Card>
              </Col>
            </Row>
            
            <div style={{ 
              background: token.colorPrimaryBg, 
              padding: 24, 
              borderRadius: 8,
              marginTop: 48,
              textAlign: 'center'
            }}>
              <Title level={3} style={{ color: token.colorPrimary }}>
                ¿Listo para tu aventura?
              </Title>
              <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
                Reserva ahora tus equipos y disfruta de la mejor experiencia en el Caribe
              </Paragraph>
              <Button 
                type="primary" 
                size="large"
                onClick={() => setActiveTab('reservar')}
              >
                Reservar ahora
              </Button>
            </div>
          </div>
        )}
      </Content>
      
      <Footer style={{ 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
        color: 'white',
        padding: '24px 50px'
      }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: 'white' }}>Parador Caribeño</Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Ofreciendo las mejores experiencias
            </Paragraph>
          </Col>
          
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: 'white' }}>Horario de atención</Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Lunes a Domingo: 8:00 AM - 6:00 PM
            </Paragraph>
          </Col>
          
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: 'white' }}>Contacto</Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Tel: +1 (555) 123-4567<br />
              Email: info@paradorcaribe.com<br />
            </Paragraph>
          </Col>
        </Row>

      </Footer>
    </Layout>
  );
}

export default App;