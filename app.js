const users = {
  maria: {
    password: '1234',
    name: 'María López',
    team: 'Cobranza',
    authorizedTeamMembers: ['María López', 'Juan Pérez', 'Ana Torres'],
  },
  juan: {
    password: '1234',
    name: 'Juan Pérez',
    team: 'Cobranza',
    authorizedTeamMembers: ['Juan Pérez', 'María López'],
  },
};

const invoices = [
  {
    id: 'FAC-1001',
    client: 'Comercial Delta',
    amount: 250000,
    status: 'pendiente',
    proposedPaymentDate: '2026-04-20',
    actualPaymentDate: '',
    comments: 'Cliente solicita confirmación de OC.',
    owner: 'María López',
    updatedAt: '2026-04-15T10:00:00',
  },
  {
    id: 'FAC-1002',
    client: 'Constructora Norte',
    amount: 420000,
    status: 'pendiente',
    proposedPaymentDate: '2026-04-22',
    actualPaymentDate: '',
    comments: 'En revisión con tesorería.',
    owner: 'Juan Pérez',
    updatedAt: '2026-04-15T12:30:00',
  },
  {
    id: 'FAC-1003',
    client: 'Transporte Andino',
    amount: 130000,
    status: 'pagada',
    proposedPaymentDate: '2026-04-10',
    actualPaymentDate: '2026-04-11',
    comments: 'Pago recibido con 1 día de atraso.',
    owner: 'Ana Torres',
    updatedAt: '2026-04-14T09:15:00',
  },
];

const notifications = [
  {
    id: crypto.randomUUID(),
    message: 'Ana Torres marcó FAC-1003 como pagada (11/04/2026).',
    createdAt: '2026-04-14T09:16:00',
  },
  {
    id: crypto.randomUUID(),
    message: 'Juan Pérez actualizó fecha propuesta de FAC-1002 al 22/04/2026.',
    createdAt: '2026-04-15T12:31:00',
  },
];

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const welcomeTitle = document.getElementById('welcome-title');
const pendingList = document.getElementById('pending-list');
const allList = document.getElementById('all-list');
const selectedInvoiceTitle = document.getElementById('selected-invoice-title');
const invoiceForm = document.getElementById('invoice-form');
const newInvoiceForm = document.getElementById('new-invoice-form');
const notificationList = document.getElementById('notification-list');
const liveNotification = document.getElementById('live-notification');
const logoutBtn = document.getElementById('logout-btn');

let currentUser = null;
let currentInvoiceId = null;

function formatDate(dateISO) {
  if (!dateISO) return '—';

  return new Date(`${dateISO}T00:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function getAccessibleInvoices() {
  if (!currentUser) return [];

  return invoices.filter((invoice) =>
    currentUser.authorizedTeamMembers.includes(invoice.owner)
  );
}

function findInvoiceById(invoiceId) {
  return invoices.find((invoice) => invoice.id === invoiceId);
}

function showLiveNotification(message) {
  liveNotification.textContent = `🔔 ${message}`;
  liveNotification.classList.remove('hidden');

  setTimeout(() => {
    liveNotification.classList.add('hidden');
  }, 3500);
}

function pushNotification(message) {
  notifications.unshift({
    id: crypto.randomUUID(),
    message,
    createdAt: new Date().toISOString(),
  });

  showLiveNotification(message);
  renderNotifications();
}

function renderInvoiceList(targetList, source) {
  targetList.innerHTML = '';

  source.forEach((invoice) => {
    const li = document.createElement('li');
    li.className = `invoice-item ${invoice.status}`;
    li.innerHTML = `
      <strong>${invoice.id} · ${invoice.client}</strong>
      <p>Monto: ${formatCurrency(invoice.amount)}</p>
      <p>Propuesta: ${formatDate(invoice.proposedPaymentDate)}</p>
      <p>Pago real: ${formatDate(invoice.actualPaymentDate)}</p>
      <p>Estado: <span class="status ${invoice.status}">${invoice.status}</span></p>
      <small>Responsable: ${invoice.owner}</small>
    `;

    li.addEventListener('click', () => {
      [...targetList.children].forEach((child) => child.classList.remove('active'));
      li.classList.add('active');
      loadInvoiceIntoForm(invoice.id);
    });

    targetList.appendChild(li);
  });

  if (!source.length) {
    targetList.innerHTML = '<li class="muted">No hay facturas para mostrar.</li>';
  }
}

function renderPending() {
  const pending = getAccessibleInvoices().filter((invoice) => invoice.status === 'pendiente');
  renderInvoiceList(pendingList, pending);
}

function renderAll() {
  const sorted = [...getAccessibleInvoices()].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
  renderInvoiceList(allList, sorted);
}

function loadInvoiceIntoForm(invoiceId) {
  const invoice = findInvoiceById(invoiceId);
  if (!invoice) return;

  currentInvoiceId = invoiceId;
  selectedInvoiceTitle.textContent = `Editar ${invoice.id} · ${invoice.client}`;
  invoiceForm.classList.remove('hidden');

  invoiceForm.proposedDate.value = invoice.proposedPaymentDate || '';
  invoiceForm.actualDate.value = invoice.actualPaymentDate || '';
  invoiceForm.status.value = invoice.status;
  invoiceForm.comment.value = invoice.comments || '';
}

function renderNotifications() {
  notificationList.innerHTML = '';

  notifications.slice(0, 20).forEach((event) => {
    const li = document.createElement('li');
    const timestamp = new Date(event.createdAt).toLocaleString('es-CL');

    li.className = 'notification-item';
    li.innerHTML = `<p>${event.message}</p><small>${timestamp}</small>`;
    notificationList.appendChild(li);
  });
}

function renderDashboard() {
  welcomeTitle.textContent = `Hola, ${currentUser.name}`;
  renderPending();
  renderAll();
  renderNotifications();

  const first = getAccessibleInvoices()[0];
  if (first) {
    loadInvoiceIntoForm(first.id);
  }
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = event.target.username.value.trim().toLowerCase();
  const password = event.target.password.value.trim();

  const found = users[username];
  if (!found || found.password !== password) {
    loginError.textContent = 'Usuario o contraseña inválidos.';
    return;
  }

  currentUser = found;
  loginError.textContent = '';
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  renderDashboard();
});

invoiceForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const invoice = findInvoiceById(currentInvoiceId);
  if (!invoice || !currentUser) return;

  const oldProposedDate = invoice.proposedPaymentDate;
  const oldActualDate = invoice.actualPaymentDate;
  const oldStatus = invoice.status;

  invoice.proposedPaymentDate = event.target.proposedDate.value;
  invoice.actualPaymentDate = event.target.actualDate.value;
  invoice.status = event.target.status.value;
  invoice.comments = event.target.comment.value.trim();
  invoice.updatedAt = new Date().toISOString();

  if (oldProposedDate !== invoice.proposedPaymentDate) {
    pushNotification(
      `${currentUser.name} cambió fecha propuesta de ${invoice.id} a ${formatDate(
        invoice.proposedPaymentDate
      )}.`
    );
  }

  if (oldActualDate !== invoice.actualPaymentDate) {
    pushNotification(
      `${currentUser.name} cambió fecha real de pago de ${invoice.id} a ${formatDate(
        invoice.actualPaymentDate
      )}.`
    );
  }

  if (oldStatus !== invoice.status) {
    pushNotification(`${currentUser.name} cambió estado de ${invoice.id} a ${invoice.status}.`);
  }

  if (invoice.comments) {
    pushNotification(`${currentUser.name} agregó comentario en ${invoice.id}: "${invoice.comments}"`);
  }

  renderPending();
  renderAll();
  loadInvoiceIntoForm(invoice.id);
});

newInvoiceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!currentUser) return;

  const formData = new FormData(event.target);
  const client = formData.get('client').trim();
  const amount = Number(formData.get('amount'));
  const proposedDate = formData.get('proposedDate');
  const comment = formData.get('comment').trim();

  const newInvoice = {
    id: `FAC-${1000 + invoices.length + 1}`,
    client,
    amount,
    status: 'pendiente',
    proposedPaymentDate: proposedDate,
    actualPaymentDate: '',
    comments: comment,
    owner: currentUser.name,
    updatedAt: new Date().toISOString(),
  };

  invoices.unshift(newInvoice);
  pushNotification(
    `${currentUser.name} creó ${newInvoice.id} para ${newInvoice.client} con fecha propuesta ${formatDate(
      newInvoice.proposedPaymentDate
    )}.`
  );

  event.target.reset();
  renderPending();
  renderAll();
  loadInvoiceIntoForm(newInvoice.id);
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  currentInvoiceId = null;
  invoiceForm.classList.add('hidden');
  loginForm.reset();
  dashboardView.classList.add('hidden');
  loginView.classList.remove('hidden');
});
