<script>
import BMap from './libs/BMap';
import data from './libs/data';

export default {
  name: 'App',

  mounted() {
    const mapClient = new BMap({
      el: 'app',
    });

    const points = data.display.map(({lon, lat}) => ({lng: +lon/600000, lat: +lat/600000}));
    window.mapClient = mapClient;

    mapClient.renderTrack(points);
  }
}
</script>
