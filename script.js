// ===== SISTEMA DE AUTENTICAÇÃO =====

// Dados de usuários (em produção, isso viria de um banco de dados)
const users = [
    { nome: 'João Silva', senha: '123456', cargo: 'plotter' },
    { nome: 'Maria Santos', senha: '123456', cargo: 'corte' },
    { nome: 'Pedro Costa', senha: '123456', cargo: 'separacao' },
    { nome: 'Ana Oliveira', senha: '123456', cargo: 'bordadoSilk' },
    { nome: 'Carlos Lima', senha: '123456', cargo: 'oficina' },
    { nome: 'Lucia Ferreira', senha: '123456', cargo: 'acabamento' }
];

// Usuário logado atualmente
let currentUser = null;

// Função para verificar se o usuário está logado
function isLoggedIn() {
    return currentUser !== null;
}

// Função para fazer login
function handleLogin(event) {
    event.preventDefault();
    
    const nomeCompleto = document.getElementById('nomeCompleto').value.trim();
    const senha = document.getElementById('senha').value;
    const cargo = document.getElementById('cargo').value;
    
    if (!nomeCompleto || !senha || !cargo) {
        showNotification('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    // Verificar credenciais
    const user = users.find(u => 
        u.nome.toLowerCase() === nomeCompleto.toLowerCase() && 
        u.senha === senha && 
        u.cargo === cargo
    );
    
    if (user) {
        // Login bem-sucedido
        currentUser = user;
        
        // Salvar dados do usuário no localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        showNotification(`Bem-vindo(a), ${user.nome}!`, 'success');
        
        // Redirecionar para a página principal após um breve delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showNotification('Credenciais inválidas. Verifique nome, senha e cargo.', 'error');
    }
}

// Função para fazer logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showNotification('Logout realizado com sucesso!', 'info');
    
    // Redirecionar para a página de login
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Função para verificar autenticação na página principal
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    // Se não estiver logado e estiver na página principal, redirecionar para login
    if (!isLoggedIn() && window.location.pathname.includes('index.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    // Se estiver logado e estiver na página de login, redirecionar para principal
    if (isLoggedIn() && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
        return;
    }
}

// Função para exibir informações do usuário logado
function displayUserInfo() {
    if (!isLoggedIn()) return;
    
    // Adicionar informações do usuário no header
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <div class="user-details">
                <span class="user-name">${currentUser.nome}</span>
                <span class="user-role">${getStageDisplayName(currentUser.cargo)}</span>
            </div>
            <button class="btn-logout" onclick="logout()">
                <span>🚪 Sair</span>
            </button>
        `;
        
        // Inserir antes da barra de busca
        const searchBar = headerActions.querySelector('.search-bar');
        if (searchBar) {
            headerActions.insertBefore(userInfo, searchBar);
        } else {
            headerActions.appendChild(userInfo);
        }
    }
}

// Função para verificar permissões baseadas no cargo
function hasPermission(stage) {
    if (!isLoggedIn()) return false;
    
    // Usuários podem ver e modificar apenas suas etapas específicas
    return currentUser.cargo === stage;
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    try {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ',
            warning: '⚠'
        };
        
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">${icons[type] || icons.info}</span>
                    <p style="margin: 0; font-weight: 600;">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: inherit; cursor: pointer; margin-left: 12px; opacity: 0.7; font-size: 1.2rem; font-weight: bold;">
                    ×
                </button>
            </div>
        `;

        const notificationsContainer = document.getElementById('notifications');
        if (notificationsContainer) {
            notificationsContainer.appendChild(notification);
        }

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
    } catch (error) {
        console.error('Error in showNotification:', error);
    }
}

// Função para obter nome de exibição da etapa
function getStageDisplayName(stage) {
    const names = {
        plotter: 'Plotter',
        corte: 'Corte',
        separacao: 'Separação',
        bordadoSilk: 'Bordado/Silk',
        oficina: 'Oficina',
        acabamento: 'Acabamento'
    };
    return names[stage] || stage;
}

// ===== FUNÇÕES EXISTENTES =====

// Variáveis globais
let orders = [];
let orderIdCounter = 1;
let filteredOrders = [];

// Função para renderizar a tabela de pedidos com restrições de permissão
function renderOrderTable() {
    const tbody = document.getElementById('orderTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const ordersToShow = filteredOrders.length > 0 ? filteredOrders : orders;
    
    ordersToShow.forEach(order => {
        const row = document.createElement('tr');
        
        // Células básicas (sempre visíveis)
        row.innerHTML = `
            <td>${order.cliente}</td>
            <td>${order.numeroPedido}</td>
            <td>${formatDate(order.entrada)}</td>
            <td>${formatDate(order.entrega)}</td>
            <td class="text-center">
                ${order.layout ? 
                    `<button class="btn-image" onclick="viewImage('${order.layout}')">📷 Ver</button>` : 
                    `<button class="btn-upload" onclick="uploadLayout(${order.id})">📤 Upload</button>`
                }
            </td>
        `;
        
        // Células das etapas de produção (com restrições de permissão)
        const stages = ['plotter', 'corte', 'separacao', 'bordadoSilk', 'oficina', 'acabamento'];
        
        stages.forEach(stage => {
            const cell = document.createElement('td');
            cell.className = 'text-center';
            
            if (hasPermission(stage)) {
                // Usuário tem permissão para esta etapa - pode marcar/desmarcar
                const isCompleted = order[stage];
                cell.innerHTML = `
                    <input type="checkbox" 
                           ${isCompleted ? 'checked' : ''} 
                           onchange="updateStage(${order.id}, '${stage}', this.checked)"
                           style="transform: scale(1.5); cursor: pointer;">
                `;
            } else {
                // Usuário não tem permissão - apenas visualiza
                const isCompleted = order[stage];
                cell.innerHTML = `
                    <span style="color: ${isCompleted ? '#10b981' : '#6b7280'}; font-size: 1.2rem;">
                        ${isCompleted ? '✅' : '⏳'}
                    </span>
                `;
            }
            
            row.appendChild(cell);
        });
        
        // Células finais
        row.innerHTML += `
            <td>${order.observacao || '-'}</td>
            <td class="text-center">
                <button class="btn-edit" onclick="editOrder(${order.id})">✏️</button>
                <button class="btn-delete" onclick="deleteOrder(${order.id})">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    updateStats();
}

// Função para atualizar o status de uma etapa
function updateStage(orderId, stage, isCompleted) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order[stage] = isCompleted;
        
        // Salvar no localStorage
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Atualizar estatísticas
        updateStats();
        
        // Mostrar notificação
        const stageName = getStageDisplayName(stage);
        const status = isCompleted ? 'concluída' : 'pendente';
        showNotification(`Etapa ${stageName} marcada como ${status}`, 'success');
    }
}

// Função para formatar data
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Função para adicionar novo pedido
function addNewOrder() {
    document.getElementById('orderModal').style.display = 'block';
}

// Função para fechar modal
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Função para salvar pedido
function saveOrder() {
    const cliente = document.getElementById('cliente').value.trim();
    const numeroPedido = document.getElementById('numeroPedido').value.trim();
    const entrada = document.getElementById('entrada').value;
    const entrega = document.getElementById('entrega').value;
    const observacao = document.getElementById('observacao').value.trim();
    
    if (!cliente || !numeroPedido || !entrada || !entrega) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    const newOrder = {
        id: orderIdCounter++,
        cliente,
        numeroPedido,
        entrada,
        entrega,
        observacao,
        plotter: false,
        corte: false,
        separacao: false,
        bordadoSilk: false,
        oficina: false,
        acabamento: false,
        layout: null
    };
    
    orders.push(newOrder);
    
    // Salvar no localStorage
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Atualizar interface
    renderOrderTable();
    closeModal();
    
    // Limpar formulário
    document.getElementById('orderForm').reset();
    
    showNotification('Pedido adicionado com sucesso!', 'success');
}

// Função para editar pedido
function editOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        document.getElementById('cliente').value = order.cliente;
        document.getElementById('numeroPedido').value = order.numeroPedido;
        document.getElementById('entrada').value = order.entrada;
        document.getElementById('entrega').value = order.entrega;
        document.getElementById('observacao').value = order.observacao || '';
        
        // Marcar para edição
        order.editing = true;
        
        document.getElementById('orderModal').style.display = 'block';
    }
}

// Função para deletar pedido
function deleteOrder(orderId) {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
        renderOrderTable();
        showNotification('Pedido excluído com sucesso!', 'success');
    }
}

// Função para upload de layout
function uploadLayout(orderId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    order.layout = e.target.result;
                    localStorage.setItem('orders', JSON.stringify(orders));
                    renderOrderTable();
                    showNotification('Layout enviado com sucesso!', 'success');
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Função para visualizar imagem
function viewImage(imageSrc) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    img.src = imageSrc;
    modal.style.display = 'block';
}

// Função para fechar modal de imagem
function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
}

// Função para atualizar estatísticas
function updateStats() {
    const totalOrders = orders.length;
    const inProduction = orders.filter(o => 
        o.plotter || o.corte || o.separacao || o.bordadoSilk || o.oficina || o.acabamento
    ).length;
    const withLayout = orders.filter(o => o.layout).length;
    const waitingCut = orders.filter(o => o.plotter && !o.corte).length;
    const completed = orders.filter(o => 
        o.plotter && o.corte && o.separacao && o.bordadoSilk && o.oficina && o.acabamento
    ).length;
    
    // Calcular atrasos (pedidos com data de entrega vencida)
    const today = new Date();
    const delayed = orders.filter(o => {
        const entrega = new Date(o.entrega);
        return entrega < today && !(o.plotter && o.corte && o.separacao && o.bordadoSilk && o.oficina && o.acabamento);
    }).length;
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('inProduction').textContent = inProduction;
    document.getElementById('withLayout').textContent = withLayout;
    document.getElementById('waitingCut').textContent = waitingCut;
    document.getElementById('completed').textContent = completed;
    document.getElementById('delayed').textContent = delayed;
}

// Função para buscar pedidos
function searchOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        filteredOrders = [];
    } else {
        filteredOrders = orders.filter(order => 
            order.cliente.toLowerCase().includes(searchTerm) ||
            order.numeroPedido.toLowerCase().includes(searchTerm)
        );
    }
    
    renderOrderTable();
}

// Carregar dados salvos
function loadData() {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
        orderIdCounter = Math.max(...orders.map(o => o.id), 0) + 1;
    }
}

// Configurar event listeners quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de login
    if (window.location.pathname.includes('login.html')) {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Verificar se já está logado
        checkAuth();
    } else {
        // Verificar autenticação na página principal
        checkAuth();
        
        // Se estiver logado, exibir informações do usuário e carregar dados
        if (isLoggedIn()) {
            displayUserInfo();
            loadData();
            renderOrderTable();
            
            // Configurar busca
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', searchOrders);
            }
        }
    }
});
