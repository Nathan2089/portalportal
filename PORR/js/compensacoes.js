/**
 * =============================================================================
 * RENOVA SENAI - MÓDULO DE COMPENSAÇÕES (compensacoes.js)
 * Controle de Obrigações geradas por 5 atrasos ou faltas e registro de cumprimento
 * =============================================================================
 */

class CompensacoesController {
  constructor() {
    this.filtroTipo = 'TODOS'; // 'TODOS', 'ATRASOS', 'FALTAS'
  }

  init() {
    this.renderizar();
  }

  renderizar() {
    const tbody = document.getElementById('compensacoesTableBody');
    if (!tbody) return;

    let lista = window.db.getCompensacoes();
    
    // Aplicar filtro
    if (this.filtroTipo === 'ATRASOS') {
      lista = lista.filter(c => c.tipoOrigem === 'ATRASOS' || c.motivoOrigem.includes('atrasos'));
    } else if (this.filtroTipo === 'FALTAS') {
      lista = lista.filter(c => c.tipoOrigem === 'FALTAS' || c.motivoOrigem.includes('Frequência abaixo'));
    }

    tbody.innerHTML = lista.map(c => {
      const isAtrasos = c.tipoOrigem === 'ATRASOS' || c.motivoOrigem.includes('atrasos');
      const isFaltas = c.tipoOrigem === 'FALTAS' || c.motivoOrigem.includes('Frequência abaixo');
      const tipoBadge = isFaltas 
        ? '<span class="portal-tag-pill" style="background:#fee2e2; color:#991b1b; font-size:10px;">🔴 FALTAS</span>'
        : '<span class="portal-tag-pill" style="background:#fef3c7; color:#b45309; font-size:10px;">⚠️ ATRASOS</span>';
      
      return `
        <tr class="${isFaltas ? 'row-freq-critical' : ''}">
          <td><strong>${c.alunoNome}</strong></td>
          <td>
            ${tipoBadge}
            <div style="font-weight:600; margin-top:4px;">${c.motivoOrigem}</div>
            <div style="font-size:11.5px; color:var(--text-muted);">Carga: <strong>${c.horasObrigacao} horas</strong> &bull; Prazo Limite: ${c.dataLimite}</div>
          </td>
          <td>
            ${c.status === 'PENDENTE' 
              ? '<span class="delays-warning-chip" style="font-size:12px;">⏳ PENDENTE</span>' 
              : '<span style="color:#16a34a; font-weight:700; font-size:12px;">✅ CUMPRIDA</span>'}
          </td>
          <td>
            <div style="font-size:12.5px;">${c.atividadeDescricao || 'Atividade a definir'}</div>
            ${c.dataCumprimento ? `<div style="font-size:11px; color:#16a34a;">Cumprida em: ${c.dataCumprimento}</div>` : ''}
          </td>
          <td style="text-align: right;">
            ${c.status === 'PENDENTE' ? `
              <button type="button" class="btn btn-sm btn-primary" onclick="window.compensacoesController.abrirModalCumprimento(${c.id})">
                Registrar Cumprimento
              </button>
            ` : `
              <span style="font-size:12px; color:var(--text-muted);">Homologado</span>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // Renderizar filtros se não existirem
    this.renderizarFiltros();
  }

  renderizarFiltros() {
    const headerRow = document.querySelector('#tabSection_compensacoes .section-header-row');
    if (!headerRow || headerRow.querySelector('.compensacoes-filtro')) return;

    const filtroHtml = `
      <div class="compensacoes-filtro" style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
        <button type="button" class="btn btn-sm ${this.filtroTipo === 'TODOS' ? 'btn-primary' : 'btn-outline'}" 
          onclick="window.compensacoesController.setFiltro('TODOS')">Todas</button>
        <button type="button" class="btn btn-sm ${this.filtroTipo === 'ATRASOS' ? 'btn-primary' : 'btn-outline'}" 
          onclick="window.compensacoesController.setFiltro('ATRASOS')" style="border-color:#fcd34d; color:#b45309;">
          <span class="portal-tag-pill" style="background:#fef3c7; color:#b45309; padding:0 8px;">⚠️ Atrasos</span>
        </button>
        <button type="button" class="btn btn-sm ${this.filtroTipo === 'FALTAS' ? 'btn-primary' : 'btn-outline'}" 
          onclick="window.compensacoesController.setFiltro('FALTAS')" style="border-color:#fca5a5; color:#991b1b;">
          <span class="portal-tag-pill" style="background:#fee2e2; color:#991b1b; padding:0 8px;">🔴 Faltas</span>
        </button>
      </div>
    `;
    
    headerRow.insertAdjacentHTML('beforeend', filtroHtml);
  }

  setFiltro(tipo) {
    this.filtroTipo = tipo;
    this.renderizar();
  }

  abrirModalCumprimento(compId) {
    document.getElementById('inputCompensacaoId').value = compId;
    window.app.abrirModal('modalRegistrarCompensacao');
  }

  salvarCumprimento() {
    const compId = document.getElementById('inputCompensacaoId').value;
    const desc = document.getElementById('textCompensacaoRelato').value;

    if (!desc) {
      window.app.mostrarToast('Descreva a atividade realizada pelo aluno.', 'warning');
      return;
    }

    window.db.registrarCompensacaoCumprida(compId, desc);
    window.app.fecharModal('modalRegistrarCompensacao');
    window.app.mostrarToast('Compensação registrada e homologada com sucesso!', 'success');
    this.renderizar();
  }
}

window.compensacoesController = new CompensacoesController();
