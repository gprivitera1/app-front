import React, { useState, useEffect } from 'react';
//import { loadStripe } from '@stripe/stripe-js';
//import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  DatePicker, 
  InputNumber, 
  Checkbox, 
  Card, 
  Row, 
  Col, 
  Steps, 
  message, 
  Typography,
  Alert,
  Spin,
  Empty, 
  Modal
} from 'antd';
import axios from 'axios';
import moment from 'moment';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';


const { Step } = Steps;
const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE_URL = 'http://localhost:5000/api';

//const stripePromise = loadStripe('tu_clave_publica_de_stripe');

const RentalForm = ({ initialActiveTab = 'reservar' }) => {
  const [activeTab, setActiveTab] = useState('reservar');
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [tempReservationId, setTempReservationId] = useState(null);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stormInsurance, setStormInsurance] = useState(false);
  const [products, setProducts] = useState([]);
  const [formComplete, setFormComplete] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [timeSelected, setTimeSelected] = useState(false);
  const [showReservationsOnly, setShowReservationsOnly] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [timeZone, setTimeZone] = useState('America/Argentina/Buenos_Aires'); // Ajusta según tu 
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [createdReservationId, setCreatedReservationId] = useState(null);

  useEffect(() => {
    validateForm();
  }, [timeSelected]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/products`);
        setProducts(response.data);
      } catch (error) {
        message.error('Error al cargar los productos');
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let total = selectedProducts.reduce((sum, item) => {
      const product = products.find(p => p._id === item.productId);
      if (!product) return sum;
      return sum + (product.price * item.quantity * item.slots);
    }, 0);

    const discount = selectedProducts.length > 1 ? total * 0.1 : 0;
    setDiscountApplied(selectedProducts.length > 1);
    total -= discount;

    if (stormInsurance) total += total * 0.2;

    setTotalPrice(total);
  }, [selectedProducts, stormInsurance, products]);

  const disabledDate = (current) => {
    if (!current) return false;
    
    const now = moment();
    const maxDateTime = getMaxDateTime();
    
    if (current < now.startOf('day')) {
      return true;
    }
    
    return current > maxDateTime.endOf('day');
  };

  useEffect(() => {
    setActiveTab(initialActiveTab);
    setShowReservationsOnly(initialActiveTab === 'myReservations');
  }, [initialActiveTab]);

  const isDateWithin48Hours = (date) => {
    if (!date) return false;
    const now = moment();
    const maxDateTime = getMaxDateTime();
    return date.isSameOrAfter(now) && date.isSameOrBefore(maxDateTime);
  };

  const updateSafetyEquipment = (productId, newQuantity) => {
    setSelectedProducts(prev => 
      prev.map(item => {
        if (item.productId === productId) {
          const product = products.find(p => p._id === productId);
          if (!product) return item;
          
          return {
            ...item,
            quantity: newQuantity,
            helmets: product.requiresHelmet ? newQuantity : item.helmets,
            vests: product.requiresVest ? newQuantity : item.vests
          };
        }
        return item;
      })
    );
  };

  const filterAvailableTimes = (times, selectedDate) => {
    if (!selectedDate) return times;
    
    const now = moment();
    const maxDateTime = getMaxDateTime();
    const isToday = selectedDate.isSame(now, 'day');
    
    return times.filter(time => {
      const timeMoment = moment(`${selectedDate.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm');
      
      if (isToday && timeMoment.isBefore(now)) {
        return false;
      }
      
      return timeMoment.isSameOrBefore(maxDateTime);
    });
  };

  const getMaxDateTime = () => {
    return moment().add(48, 'hours');
  };

  const fetchAvailableTimes = async (date) => {
    if (!date) return;
    
    setTimeSlotsLoading(true);
    setDateSelected(true);
    setAvailableTimes([]);
    setTimeSelected(false);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/available-times`, {
        params: { 
          date: date.format('YYYY-MM-DD')
        }
      });
      
      const allTimes = Array.isArray(response.data?.times) ? response.data.times : [];
      const filteredTimes = filterAvailableTimes(allTimes, date);
      
      if (filteredTimes.length === 0) {
        message.info('No hay horarios disponibles para esta fecha');
      }
      
      setAvailableTimes(filteredTimes);
    } catch (error) {
      console.error('Error fetching available times:', error);
      message.error('Error al obtener horarios disponibles');
    } finally {
      setTimeSlotsLoading(false);
      validateForm();
    }
  };

  const validateForm = () => {
    try {
      const values = form.getFieldsValue(true);
      
      const hasProducts = selectedProducts.length > 0;
      const hasDate = values.date && values.date.isValid();
      const hasTime = values.startTime && values.startTime.trim() !== '';
      const hasDateAndTime = hasDate && hasTime;
      
      const hasFullName = values.fullName && values.fullName.trim() !== '';
      const hasValidEmail = values.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
      const hasValidPhone = values.phone && /^[0-9]{10,15}$/.test(values.phone);
      const hasPaymentMethod = values.paymentMethod;
      const hasCurrency = values.currency;
      
      const hasCustomerInfo = hasFullName && hasValidEmail && hasValidPhone && 
                              hasPaymentMethod && hasCurrency;
      
      setDateSelected(hasDate);
      setTimeSelected(hasTime);
      setFormComplete(hasProducts && hasDateAndTime && hasCustomerInfo);
      
    } catch (e) {
      console.error('Error en validación:', e);
      setFormComplete(false);
    }
  };

  const ReservationSuccess = ({ reservationId, onReset }) => {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px 16px',
      maxWidth: 600,
      margin: '0 auto'
    }}>
      <CheckCircleOutlined style={{ 
        fontSize: '64px', 
        color: '#52c41a',
        marginBottom: 24
      }} />
      
      <Title level={2} style={{ marginBottom: 16 }}>
        ¡Reserva Exitosa!
      </Title>
      
      <p style={{ fontSize: 18, marginBottom: 24 }}>
        Tu reserva ha sido confirmada con el ID:
      </p>
      
      <div style={{ 
        backgroundColor: '#f0f0f0',
        padding: '16px',
        borderRadius: 8,
        marginBottom: 32
      }}>
        <Text strong style={{ fontSize: 20 }}>{reservationId}</Text>
      </div>
      
      <Alert 
        message="Guarda este número para futuras consultas o cancelaciones. Para realizar cancelaciones comuniquese al +1 (555) 123-4567 o bien al mail info@paradorcaribe.com"
        type="info"
        showIcon
        style={{ marginBottom: 32 }}
      />
 
      
      <div>
        <Button 
          type="primary" 
          onClick={onReset}
          style={{ marginRight: 16 }}
        >
          Hacer otra reserva
        </Button>
      
      </div>
    </div>
  );
};

  const MyReservationsTab = () => {
    const [reservationSearch, setReservationSearch] = useState({ reservationId: '', email: '' });
    const [myReservations, setMyReservations] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);

    const fetchReservations = async () => {
       if (!reservationSearch.email.trim() && !reservationSearch.reservationId.trim()) {
      message.warning('Por favor ingrese un email o ID de reserva para buscar');
      setMyReservations([]);
      return;
    }
      setSearchLoading(true);
      try {
      const response = await axios.get(`${API_BASE_URL}/reservations`, {
        params: {
          email: reservationSearch.email.trim() || undefined,
          reservationId: reservationSearch.reservationId.trim() || undefined
        }
      });
        setMyReservations(response.data);
        console.log(response.data);
      } catch (error) {
        console.error('Error al cargar reservas:', error);
        message.error('Error al cargar reservas');
        setMyReservations([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const handleCancel = async (reservationId) => {
      setCancelLoading(true);
      try {
        const response = await axios.delete(`${API_BASE_URL}/reservations/${reservationId}`);
        if (response.data.message) {
          message.success(response.data.message);
          fetchReservations();
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error al cancelar reserva';
        message.error(errorMessage);
      } finally {
        setCancelLoading(false);
      }
    };

    const canCancelWithoutCost = (reservation) => {
      if (reservation.status === 'confirmed' || reservation.status === 'pending') {
        return { canCancel: true, message: 'Solo se pueden cancelar reservas que no sean canceladas ya antes y dos horas antes previa al turno' };
      }
      
    try {  
      const dateUTC = moment.utc(reservation.date);
      
      // Extraer componentes de la hora local
      const [hours, minutes] = reservation.startTime.split(':').map(Number);
      
      // Crear fecha/hora completa en UTC
      const reservationDateTime = dateUTC
        .clone()
        .set({ 
          hour: hours, 
          minute: minutes, 
          second: 0, 
          millisecond: 0 
        })
        .tz(timeZone); // Convertir a zona horaria local
      
      // Obtener hora actual en la misma zona horaria
      const now = moment().tz(timeZone);
      
      // Calcular diferencia en horas con precisión
      const hoursDifference = reservationDateTime.diff(now, 'hours', true);

      if (hoursDifference > 2) {
        return { 
          canCancel: true, 
          message: 'Puedes cancelar sin costo' 
        };
      } else if (hoursDifference > 0) {
        // Calcular tiempo restante con precisión
        const duration = moment.duration(reservationDateTime.diff(now));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        
        return { 
          canCancel: false, 
          message: `Solo se puede cancelar sin costo con más de 2 horas de anticipación. 
                    Tiempo restante: ${hours}h ${minutes}min` 
        };
        } else {
          return { 
            canCancel: false, 
            message: 'El turno ya ha comenzado o finalizado' 
          };
        }
      } catch (e) {
        console.error('Error calculando diferencia horaria:', e);
        return { 
          canCancel: false, 
          message: 'Error al verificar el estado de cancelación' 
        };
      }
    };

    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          Reservas
        </Title>
        
        <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Input
              placeholder="ID de Reserva"
              value={reservationSearch.reservationId}
              onChange={(e) => setReservationSearch({...reservationSearch, reservationId: e.target.value})}
            />
          </Col>
          <Col span={12}>
            <Input
              placeholder="Email"
              value={reservationSearch.email}
              onChange={(e) => setReservationSearch({...reservationSearch, email: e.target.value})}
            />
          </Col>
        </Row>
        <Button 
          type="primary" 
          onClick={fetchReservations}
          loading={searchLoading}
          style={{ marginTop: 16 }}
        >
          Buscar Reservas
        </Button>
      </Card>

        {myReservations.length === 0 ? (
          <Empty description="No se encontraron reservas" />
        ) : (
          myReservations.map(reservation => {
            const cancelInfo = canCancelWithoutCost(reservation);
            
            return (
              <Card 
                key={reservation._id} 
                style={{ 
                  marginBottom: 16, 
                  borderLeft: `4px solid ${reservation.status === 'canceled' ? '#f5222d' : '#52c41a'}`
                }}
              >
                <Row gutter={16}>
                  <Col span={16}>
                    <Title level={4}>Reserva: {reservation._id}</Title>
                    <p><strong>Fecha:</strong> 
                      {moment.utc(reservation.date).format('DD/MM/YYYY')} - {reservation.startTime}
                    </p>
                    <p><strong>Estado:</strong> 
                      <span style={{ 
                        color: reservation.status === 'confirmed' ? '#52c41a' : 
                              reservation.status === 'canceled' ? '#f5222d' : '#faad14',
                        marginLeft: 8
                      }}>
                        {reservation.status === 'confirmed' ? 'Confirmada' : 
                          reservation.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                      </span>
                    </p>
                    <p><strong>Productos:</strong></p>
                    <ul>
                      {reservation.products.map((item, index) => (
                        <li key={index}>
                          {item.product.name} x {item.quantity} ({item.slots} turnos)
                        </li>
                      ))}
                    </ul>
                    <p><strong>Total:</strong> ${reservation.totalPrice.toFixed(2)}</p>
                    <p><strong>Seguro de tormenta:</strong>{reservation.stormInsurance ? " Tiene" : " No tiene"}</p>
                  </Col>
                  <Col span={8} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {(reservation.status === 'confirmed' || reservation.status === 'pending') && (
                      <Button 
                        danger 
                        onClick={() => {
                          setReservationToCancel(reservation);
                          setCancelModalVisible(true);
                        }}
                        loading={cancelLoading && reservationToCancel?._id === reservation._id}
                        disabled={!cancelInfo.canCancel}
                      >
                        Cancelar Reserva
                      </Button>
                    )}
                  </Col>
                </Row>
              </Card>
            );
          })
        )}

        {/* Modal de confirmación de cancelación */}
        <Modal
          title="Confirmar Cancelación"
          visible={cancelModalVisible}
          onOk={() => {
            if (reservationToCancel) {
              handleCancel(reservationToCancel._id);
            }
            setCancelModalVisible(false);
          }}
          onCancel={() => setCancelModalVisible(false)}
          okText="Confirmar"
          cancelText="Volver"
          confirmLoading={cancelLoading}
        >
          {reservationToCancel && (
            <>
              <p>¿Estás seguro de que deseas cancelar la reserva {reservationToCancel._id}?</p>
              <Alert 
                message={canCancelWithoutCost(reservationToCancel).message} 
                type={canCancelWithoutCost(reservationToCancel).canCancel ? "success" : "warning"} 
                showIcon 
              />
            </>
          )}
        </Modal>
      </div>
    );
  };

  const handleSubmit = async () => {
    try {
      const values = {
        ...form.getFieldsValue(true),
        date: form.getFieldValue('date'),
        startTime: form.getFieldValue('startTime'),
        fullName: form.getFieldValue('fullName'),
        email: form.getFieldValue('email'),
        phone: form.getFieldValue('phone'),
        paymentMethod: form.getFieldValue('paymentMethod'),
        currency: form.getFieldValue('currency'),
      };
      
      if (!values.date || !values.date.isValid()) {
        message.error('Por favor, seleccione una fecha válida');
        return;
      }

      const payload = {
        customer: {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone
        },
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime,
        products: selectedProducts.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          slots: item.slots,
          helmets: item.helmets || 0,
          vests: item.vests || 0
        })),
        paymentMethod: values.paymentMethod,
        currency: values.currency,
        stormInsurance: stormInsurance
      };

      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/reservations`, payload);
       // Guardar ID de reserva y mostrar pantalla de éxito
      setCreatedReservationId(response.data._id);
      setReservationSuccess(true);
      const reservationId = response.data._id;
      
    } catch (error) {
      // Manejo de errores
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    message.success('Pago exitoso! Reserva confirmada.');
    resetForm();
    setShowPaymentForm(false);
  };

  const resetForm = () => {
  form.resetFields();
  setCurrentStep(0);
  setSelectedProducts([]);
  setStormInsurance(false);
  setAvailableTimes([]);
  setDateSelected(false);
  setShowPaymentForm(false);
  setPaymentIntentClientSecret(null);
  setTempReservationId(null);
  setReservationSuccess(false); // Resetear estado de éxito
};

  const StormRefundForm = () => {
    const [reservationId, setReservationId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async () => {
      if (!reservationId) {
        message.error('Por favor ingrese un ID de reserva');
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.post(`${API_BASE_URL}/reservations/${reservationId}/refund`);
        setResult(response.data);
        message.success('Reembolso procesado exitosamente!');
      } catch (error) {
        message.error('Error al procesar reembolso: ' + (error.response?.data?.message || error.message));
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          Solicitar Reembolso por Tormenta
        </Title>
        
        <Card>
          <div style={{ 
  color: '#ff4d4f', 
  backgroundColor: '#fff2f0', 
  padding: '12px 16px', 
  borderRadius: 4,
  border: '1px solid #ffccc7',
  marginBottom: 16,
  display: 'flex',
  alignItems: 'flex-start'
}}>
  <ExclamationCircleOutlined style={{ 
    color: '#ff4d4f', 
    fontSize: 18, 
    marginRight: 8,
    marginTop: 2
  }} />
  <div>
    Si hay tormenta y te notificaron que se cancelan los turnos por mal tiempo, 
    puedes solicitar el reembolso del 50% y esperar la confirmación del mismo 
    desde el local. (Lo verás reflejado en tu cuenta adjunta a partir de las 48 horas)
  </div>
</div>
          
          <Input
            placeholder="ID de tu reserva"
            value={reservationId}
            onChange={(e) => setReservationId(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={isLoading}
          >
            Solicitar Reembolso
          </Button>
          
          {result && (
            <div style={{ marginTop: 24 }}>
              <Title level={4}>Resultado:</Title>
              <p>Reembolso procesado: ${result.refundAmount.toFixed(2)}</p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const addProduct = (productId) => {
    const existingProduct = selectedProducts.find(p => p.productId === productId);
    const product = products.find(p => p._id === productId);

    if (!product) return;

    if (existingProduct) {
      const newQuantity = Math.min(existingProduct.quantity + 1, product.maxPeople || 10);
      updateSafetyEquipment(productId, newQuantity);
    } else {
      setSelectedProducts(prev => [
        ...prev, 
        { 
          productId, 
          quantity: 1, 
          slots: 1,
          helmets: product.requiresHelmet ? 1 : 0,
          vests: product.requiresVest ? 1 : 0
        }
      ]);
    }
  };

  useEffect(() => {
    validateForm();
  }, [selectedProducts, currentStep, form, stormInsurance]);

  if (showReservationsOnly) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <MyReservationsTab />
      </div>
    );
  }

  const steps = [
    {
      title: 'Selección de Productos',
      content: (
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {products.map(product => (
                <Col span={8} key={product._id}>
                  <Card 
                    title={product.name} 
                    extra={<Button onClick={() => addProduct(product._id)}>Agregar</Button>}
                  >
                    <p>Precio: ${product.price}/turno</p>
                    {product.requiresHelmet && <p>Incluye casco</p>}
                    {product.requiresVest && <p>Incluye chaleco salvavidas</p>}
                    {product.maxPeople && <p>Máx. {product.maxPeople} personas</p>}
                    <p>Turno: 30 minutos</p>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          <Title level={4} style={{ marginTop: 24 }}>Productos Seleccionados</Title>
          {selectedProducts.length === 0 ? (
            <Empty description="No has seleccionado ningún producto" />
          ) : (
            selectedProducts.map((item, index) => {
              const product = products.find(p => p._id === item.productId);
              if (!product) return null;
              
              const requiresEquipment = product.requiresHelmet || product.requiresVest;
              
              return (
                <Card key={index} style={{ 
                  marginBottom: 16,
                  padding: 12,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8
                }}>
                  <Row align="middle" gutter={[16, 8]}>
                    <Col span={requiresEquipment ? 4 : 6}>
                      <strong style={{ fontSize: 16 }}>{product.name}</strong>
                    </Col>
                    
                    <Col span={requiresEquipment ? 4 : 6}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: requiresEquipment ? 'flex-start' : 'center'
                      }}>
                        <Text style={{ marginRight: 8, minWidth: 70 }}>Cantidad personas:</Text>
                        <InputNumber 
                          min={1} 
                          max={product.maxPeople}
                          value={item.quantity}
                          onChange={value => {
                            updateSafetyEquipment(item.productId, value);
                            validateForm();
                          }}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>
                    
                    <Col span={requiresEquipment ? 4 : 6}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: requiresEquipment ? 'flex-start' : 'center'
                      }}>
                        <Text style={{ marginRight: 8, minWidth: 60 }}>Turnos:</Text>
                        <InputNumber 
                          min={1} 
                          max={3}
                          value={item.slots}
                          onChange={value => {
                            setSelectedProducts(prev => 
                              prev.map(p => 
                                p.productId === item.productId ? { ...p, slots: value } : p
                              )
                            );
                            validateForm();
                          }}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>
                    
                    {requiresEquipment && (
                      <Col span={8}>
                        <div style={{ display: 'flex', gap: 16 }}>
                          {product.requiresHelmet && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              flex: 1,
                              minWidth: 120
                            }}>
                              <Text style={{ marginRight: 8, minWidth: 60 }}>Cascos:</Text>
                              <InputNumber 
                                min={1}
                                max={product.maxPeople}
                                value={item.helmets}
                                onChange={value => {
                                  setSelectedProducts(prev => 
                                    prev.map(p => 
                                      p.productId === item.productId ? { ...p, helmets: value } : p
                                    )
                                  );
                                  validateForm();
                                }}
                                style={{ width: '100%' }}
                              />
                            </div>
                          )}
                          {product.requiresVest && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              flex: 1,
                              minWidth: 120
                            }}>
                              <Text style={{ marginRight: 8, minWidth: 60 }}>Chalecos:</Text>
                              <InputNumber 
                                min={1}
                                max={product.maxPeople}
                                value={item.vests}
                                onChange={value => {
                                  setSelectedProducts(prev => 
                                    prev.map(p => 
                                      p.productId === item.productId ? { ...p, vests: value } : p
                                    )
                                  );
                                  validateForm();
                                }}
                                style={{ width: '100%' }}
                              />
                            </div>
                          )}
                        </div>
                      </Col>
                    )}
                    
                    <Col span={requiresEquipment ? 4 : 6} style={{ textAlign: 'right' }}>
                      <Button 
                        danger 
                        onClick={() => {
                          setSelectedProducts(prev => 
                            prev.filter(p => p.productId !== item.productId)
                          );
                          validateForm();
                        }}
                        style={{ minWidth: 100 }}
                      >
                        Eliminar
                      </Button>
                    </Col>
                  </Row>
                </Card>
              );
            })
          )}
        </div>
      )
    },
    {
      title: 'Fecha y Hora',
      content: (
        <div>
          <Form.Item
            label="Fecha"
            name="date"
            rules={[{ 
              required: true, 
              message: 'Seleccione una fecha',
              validator: (_, value) => {
                if (!value || !value.isValid()) {
                  return Promise.reject('Fecha inválida');
                }
                
                const maxDate = moment().add(48, 'hours');
                if (value.isAfter(maxDate, 'day')) {
                  return Promise.reject('Solo se permiten reservas hasta 48 horas de anticipación');
                }
                
                return Promise.resolve();
              }
            }]}
          >
            <DatePicker 
              format="DD/MM/YYYY"
              disabledDate={disabledDate}
              onChange={(date) => {
                if (date && date.isValid()) {
                  fetchAvailableTimes(date);
                } else {
                  setDateSelected(false);
                  setAvailableTimes([]);
                  form.setFieldsValue({ startTime: undefined });
                }
                validateForm();
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, current) => prev.date !== current.date}
          >
            {({ getFieldValue }) => (
              <Form.Item
                label="Hora de inicio"
                name="startTime"
                rules={[{ 
                  required: true, 
                  message: 'Seleccione una hora' 
                }]}
              >
                {!dateSelected ? (
                  <Select placeholder="Seleccione una fecha primero" disabled>
                    <Option value="" disabled>Seleccione una fecha primero</Option>
                  </Select>
                ) : timeSlotsLoading ? (
                  <Select placeholder="Cargando horarios disponibles..." disabled>
                    <Option value="" disabled>
                      <Spin size="small" /> Cargando horarios...
                    </Option>
                  </Select>
                ) : availableTimes.length === 0 ? (
                  <Select placeholder="No hay horarios disponibles" disabled>
                    <Option value="" disabled>No hay horarios disponibles para esta fecha</Option>
                  </Select>
                ) : (
                  <Select 
                    showSearch
                    optionFilterProp="children"
                    placeholder="Seleccione un horario"
                    onChange={(value) => {
                      form.setFieldsValue({ startTime: value });
                      setTimeSelected(true);
                      validateForm();
                    }}
                    disabled={!dateSelected || timeSlotsLoading || availableTimes.length === 0}
                  >
                    {availableTimes.map(time => (
                      <Option key={time} value={time}>
                        {time}
                      </Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            )}
          </Form.Item>

          <Form.Item
            label="Duración total"
          >
            <span>
              {selectedProducts.reduce((max, item) => 
                Math.max(max, item.slots), 0
              ) * 30} minutos
            </span>
          </Form.Item>

          <Alert 
            message="Los turnos deben reservarse con un máximo de 48 horas de anticipación" 
            type="info" 
            showIcon 
            style={{ marginBottom: 16 }}
          />
        </div>
      )
    },
    {
      title: 'Información del Cliente',
      content: (
        <div>
          <Form.Item
            label="Nombre completo"
            name="fullName"
            rules={[{ 
              required: true, 
              message: 'Ingrese su nombre completo' 
            }]}
          >
            <Input onChange={validateForm} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { 
                required: true, 
                message: 'Ingrese su email' 
              },
              { 
                type: 'email', 
                message: 'Email inválido' 
              }
            ]}
          >
            <Input onChange={validateForm} />
          </Form.Item>

          <Form.Item
            label="Teléfono"
            name="phone"
            rules={[
              { 
                required: true, 
                message: 'Ingrese su teléfono' 
              },
              { 
                pattern: /^[0-9]{10,15}$/,
                message: 'Teléfono inválido' 
              }
            ]}
          >
            <Input onChange={validateForm} />
          </Form.Item>

          <Form.Item
            label="Método de Pago"
            name="paymentMethod"
            rules={[{ 
              required: true, 
              message: 'Seleccione un método' 
            }]}
          >
            <Select onChange={validateForm}>
              <Option value="cash">Efectivo en el parador</Option>
              <Option value="card">Tarjeta de crédito</Option>
              <Option value="transfer">Transferencia bancaria</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Moneda"
            name="currency"
            rules={[{ 
              required: true, 
              message: 'Seleccione moneda' 
            }]}
          >
            <Select onChange={validateForm}>
              <Option value="local">Moneda local</Option>
              <Option value="usd">Dólares USD</Option>
              <Option value="eur">Euros EUR</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="stormInsurance"
            valuePropName="checked"
          >
             <Checkbox 
    checked={stormInsurance}
    onChange={e => {
      setStormInsurance(e.target.checked);
      validateForm();
    }}
  >
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      color: '#ff4d4f',
      fontWeight: 500
    }}>
      <ExclamationCircleOutlined style={{ 
        fontSize: 16, 
        color: '#ff4d4f', 
        marginRight: 8 
      }} />
      <span>
        Seguro de tormenta (50% de devolución por mal tiempo y confirmando que el local no operará el día del turno por este motivo)
      </span>
    </div>
  </Checkbox>
          </Form.Item>
        </div>
      )
    },
    {
      title: 'Confirmación',
      content: (
        <div>
          <Title level={4}>Resumen de la Reserva</Title>
          <Card>
            {selectedProducts.length === 0 ? (
              <Empty description="No hay productos seleccionados" />
            ) : (
              selectedProducts.map((item, index) => {
                const product = products.find(p => p._id === item.productId);
                if (!product) return null;
                
                return (
                  <p key={index}>
                    {product.name} x {item.quantity} ({item.slots} turnos)
                    {item.helmets > 0 && `, Cascos: ${item.helmets}`}
                    {item.vests > 0 && `, Chalecos: ${item.vests}`}
                  </p>
                );
              })
            )}

            {form.getFieldValue('date') && (
              <p><strong>Fecha:</strong> {form.getFieldValue('date')?.format('DD/MM/YYYY')}</p>
            )}
            
            {form.getFieldValue('startTime') && (
              <p><strong>Hora de inicio:</strong> {form.getFieldValue('startTime')}</p>
            )}
            
            {form.getFieldValue('fullName') && (
              <p><strong>Cliente:</strong> {form.getFieldValue('fullName')}</p>
            )}
            
            {form.getFieldValue('email') && (
              <p><strong>Email:</strong> {form.getFieldValue('email')}</p>
            )}
            
            {form.getFieldValue('paymentMethod') && (
              <p><strong>Método de pago:</strong> {form.getFieldValue('paymentMethod')}</p>
            )}
            
            {form.getFieldValue('currency') && (
              <p><strong>Moneda:</strong> {form.getFieldValue('currency')}</p>
            )}
            
            {stormInsurance && <p><strong>Incluye seguro de tormenta</strong></p>}

            <Title level={4} style={{ marginTop: 16 }}>
              Total: ${totalPrice.toFixed(2)}
              {discountApplied && <span style={{ color: 'green', marginLeft: 8 }}>(10% descuento aplicado)</span>}
            </Title>

            {form.getFieldValue('paymentMethod') && (
              <Alert 
                message={form.getFieldValue('paymentMethod') === 'cash' 
                  ? 'Debe realizar el pago en efectivo 2 horas antes del turno' 
                  : 'El pago se procesará al confirmar la reserva'} 
                type="warning" 
                showIcon 
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </div>
      )
    }
  ];

  return (
    <div style={{ width: '100%' }}>
      {reservationSuccess ? (
        <ReservationSuccess 
          reservationId={createdReservationId}
          onReset={resetForm}
        />
      ) : (
        <>
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>

      

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          slots: 1,
          currency: 'local'
        }}
      >
        <div style={{ minHeight: 300 }}>
          {activeTab === 'reservar' && steps[currentStep].content}
          {activeTab === 'myReservations' && <MyReservationsTab />}
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          {currentStep > 0 && (
            <Button onClick={() => setCurrentStep(currentStep - 1)}>
              Anterior
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button 
              type="primary" 
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 0 && selectedProducts.length === 0) ||
                (currentStep === 1 && (
                  !dateSelected || 
                  !timeSelected || 
                  timeSlotsLoading || 
                  availableTimes.length === 0
                )) ||
                (currentStep === 2 && !(
                  form.getFieldValue('fullName') &&
                  form.getFieldValue('email') &&
                  form.getFieldValue('phone') &&
                  form.getFieldValue('paymentMethod') &&
                  form.getFieldValue('currency') &&
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.getFieldValue('email')) &&
                  /^[0-9]{10,15}$/.test(form.getFieldValue('phone'))
                ))
              }
            >
              Siguiente
            </Button>
          ) : (
            <>
              {activeTab === 'reservar' && (
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  disabled={!formComplete || isLoading}
                  loading={isLoading}
                >
                  Confirmar Reserva
                </Button>
              )}
            </>
          )}
         
        </div>
      </Form>
      </>
      )}
    </div>
  );
};

export default RentalForm;