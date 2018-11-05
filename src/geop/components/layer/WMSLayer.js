import {t} from 'Utilities/translate'
import Component from 'Geop/Component'
import $ from 'jquery'

class WMSLayer extends Component {
  constructor (target) {
    super(target)
    this.isRow = true
  }
  render () {
    this.target.append(`
      <a href="#"
        id="add-wms-layer"
        class="dropdown-item"
        data-toggle="modal"
        data-target="#modal_wmslayer">
        <i class="fa fa-plus"></i>
        ${t('Add WMS layer')}
      </a>`)
    $('body').append(`
      <div class="modal fade" id="modal_wmslayer" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 class="modal-title">${t('Add WMS layer')}</h4>
            </div>
            <div class="modal-body text-muted">
              ${'Insert WMS v.1.1.1 URL with LAYERS and SRS parameters'}
              <textarea class="form-control" rows="3"></textarea>
              <em class="small"><b>Näide:</b> (katastrikaart)<br>http://kaart.maaamet.ee/wms/alus?layers=TOPOYKSUS_6569,TOPOYKSUS_7793&SRS=EPSG:3301</em>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary confirm">${'Add'}</button>
            </div>
          </div>
        </div>
      </div>`)
  }
}

export default WMSLayer
