/**
 * =============================================================================
 * RENOVA SENAI - CARÔMETRO E OCORRÊNCIAS (ocorrencias.js)
 * Consulta de Alunos com Foto, Filtros por Origem (Coordenação, Geral, UC)
 * =============================================================================
 */

class OcorrenciasController {
  constructor() {
    this.turmaId = 1;
    this.filtroOrigem = 'TODAS';
    this.visualizacao = 'carometro'; // 'carometro' ou 'tabela'
  }

  init() {
    this.carregarTurmasSelect();
    this.carregarAlunosParaModalSelect();
    this.renderizar();
  }

  carregarTurmasSelect() {
    const sel = document.getElementById('selectOcorrenciaTurma');
    if (!sel) return;
    const turmas = window.db.getTurmas('EM_ANDAMENTO');
    sel.innerHTML = turmas.map(t => `<option value="${t.id}">${t.codigo} - ${t.nome}</option>`).join('');
    sel.value = this.turmaId;
  }

  carregarAlunosParaModalSelect() {
    const sel = document.getElementById('selectNovaOcorrenciaAluno');
    if (!sel) return;
    const alunos = window.db.getAlunosPorTurma(this.turmaId);
    sel.innerHTML = alunos.map(a => `<option value="${a.id}">${a.nome} (${a.ra})</option>`).join('');
  }

  setVisualizacao(modo) {
    this.visualizacao = modo;
    const btnCar = document.getElementById('btnViewCarometro');
    const btnTab = document.getElementById('btnViewTabela');
    if (btnCar && btnTab) {
      if (modo === 'carometro') {
        btnCar.classList.add('active');
        btnTab.classList.remove('active');
      } else {
        btnTab.classList.add('active');
        btnCar.classList.remove('active');
      }
    }
    this.renderizar();
  }

  setFiltroOrigem(origem) {
    this.filtroOrigem = origem;
    this.renderizar();
  }

  onTurmaChange(novaTurmaId) {
    this.turmaId = Number(novaTurmaId);
    this.carregarAlunosParaModalSelect();
    this.renderizar();
  }

  renderizar() {
    const container = document.getElementById('ocorrenciasConteudo');
    if (!container) return;

    const alunos = window.db.getAlunosPorTurma(this.turmaId);
    const ocorrencias = window.db.getOcorrencias(this.filtroOrigem);

    if (this.visualizacao === 'carometro') {
      container.innerHTML = `
        <div class="carometro-grid">
          ${alunos.map(aluno => {
            const ocsAluno = ocorrencias.filter(o => o.alunoId === aluno.id);
            const atrasos = window.db.getAtrasosAcumulados(aluno.id, 1);
            return `
              <div class="carometro-card">
                <img src="${aluno.foto}" alt="${aluno.nome}" class="carometro-photo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(aluno.nome)}'">
                <div class="carometro-name">${aluno.nome}</div>
                <div class="carometro-ra">${aluno.ra} &bull; Subturma ${aluno.subturma}</div>
                
                <div class="carometro-stats-strip">
                  <div>
                    <span class="carometro-stat-val" style="color:${ocsAluno.length ? 'var(--senai-red)' : 'inherit'};">${ocsAluno.length}</span>
                    <span style="color:var(--text-muted); font-size:11px;">Ocorrências</span>
                  </div>
                  <div>
                    <span class="carometro-stat-val" style="color:${atrasos >= 5 ? '#b45309' : 'inherit'};">${atrasos}</span>
                    <span style="color:var(--text-muted); font-size:11px;">Atrasos</span>
                  </div>
                  <div>
                    <span class="carometro-stat-val" style="color:${aluno.statusMatricula === 'ATIVO' ? '#16a34a' : '#ef4444'};">${aluno.statusMatricula}</span>
                    <span style="color:var(--text-muted); font-size:11px;">Status</span>
                  </div>
                </div>

                <button type="button" class="btn btn-sm btn-outline" style="width:100%;" onclick="window.ocorrenciasController.abrirDetalhesAluno(${aluno.id})">
                  Visualizar Histórico
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      // Visualização em Tabela detalhada
      container.innerHTML = `
        <div class="table-responsive">
          <table class="academic-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Aluno</th>
                <th>Origem</th>
                <th>Tipo</th>
                <th>Título / Descrição</th>
                <th>Registrado Por</th>
              </tr>
            </thead>
            <tbody>
              ${ocorrencias.length ? ocorrencias.map(o => `
                <tr>
                  <td>${o.data}</td>
                  <td><strong>${o.alunoNome}</strong></td>
                  <td><span class="portal-tag-pill" style="font-size:11px;">${o.origem}</span></td>
                  <td><span style="font-weight:700; color:${o.tipo === 'ELOGIO' ? '#16a34a' : o.tipo === 'DISCIPLINAR' ? '#b45309' : 'inherit'};">${o.tipo}</span></td>
                  <td>
                    <strong>${o.titulo}</strong>
                    <div style="font-size:12px; color:var(--text-muted);">${o.descricao}</div>
                  </td>
                  <td>${o.autor}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Nenhuma ocorrência encontrada para o filtro selecionado.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  abrirDetalhesAluno(alunoId) {
    const aluno = window.db.getAlunoById(alunoId);
    if (!aluno) return;

    const ocs = window.db.getOcorrencias('TODAS', alunoId);
    const modalBody = document.getElementById('modalAlunoDetalhesBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="display:flex; gap:20px; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:16px;">
        <img src="${aluno.foto}" style="width:72px; height:72px; border-radius:50%; object-fit:cover; border:2px solid var(--senai-red);">
        <div>
          <h3 style="margin-bottom:4px;">${aluno.nome}</h3>
          <div style="font-size:13px; color:var(--text-muted);">RA: ${aluno.ra} &bull; Matrícula: ${aluno.statusMatricula}</div>
          <div style="font-size:13px; color:var(--text-muted);">${aluno.email}</div>
        </div>
      </div>

      <h4 style="margin-bottom:12px; font-size:15px;">Histórico de Ocorrências (${ocs.length})</h4>
      <div style="display:flex; flex-direction:column; gap:10px; max-height:300px; overflow-y:auto;">
        ${ocs.length ? ocs.map(o => `
          <div style="border:1px solid var(--border-color); border-radius:8px; padding:12px; background:var(--bg-card-subtle);">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong style="color:var(--senai-red);">${o.titulo}</strong>
              <span style="font-size:11.5px; color:var(--text-muted);">${o.data}</span>
            </div>
            <div style="font-size:12.5px; margin-bottom:6px;">${o.descricao}</div>
            <div style="font-size:11px; color:var(--text-muted);">Origem: <strong>${o.origem}</strong> &bull; Autor: ${o.autor}</div>
          </div>
        `).join('') : '<p style="color:var(--text-muted); font-size:13px;">Nenhuma ocorrência registrada para este aluno.</p>'}
      </div>
    `;

    window.app.abrirModal('modalAlunoDetalhes');
  }

  salvarNovaOcorrencia() {
    const alunoId = document.getElementById('selectNovaOcorrenciaAluno').value;
    const origem = document.getElementById('selectNovaOcorrenciaOrigem').value;
    const tipo = document.getElementById('selectNovaOcorrenciaTipo').value;
    const titulo = document.getElementById('inputNovaOcorrenciaTitulo').value;
    const descricao = document.getElementById('textNovaOcorrenciaDescricao').value;

    if (!titulo || !descricao) {
      window.app.mostrarToast('Preencha o título e a descrição da ocorrência.', 'warning');
      return;
    }

    const aluno = window.db.getAlunoById(alunoId);

    window.db.addOcorrencia({
      alunoId: Number(alunoId),
      alunoNome: aluno ? aluno.nome : 'Aluno',
      origem,
      tipo,
      titulo,
      descricao,
      autor: window.auth.getUser() ? window.auth.getUser().nome : 'NATHAN SANTANA MATOS'
    });

    window.app.fecharModal('modalNovaOcorrencia');
    window.app.mostrarToast('Ocorrência registrada com sucesso!', 'success');
    this.renderizar();
  }
}

window.ocorrenciasController = new OcorrenciasController();
